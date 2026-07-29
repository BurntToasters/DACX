#!/usr/bin/env node
/**
 * Refresh assets/cacert.pem from Mozilla's CA bundle via curl.se.
 *
 * Source (documented in the PEM header):
 *   https://curl.se/ca/cacert.pem
 *   https://curl.se/docs/caextract.html
 *
 * Usage:
 *   node scripts/update-cacert.js          # download, validate, replace if changed
 *   node scripts/update-cacert.js --check  # exit 1 if local file is stale
 *
 * Nothing is written until the download passes validatePem() and its SHA256
 * matches curl.se's published cacert.pem.sha256 sidecar. (The ## SHA256: line
 * in the PEM header is Mozilla certdata.txt, not the PEM file itself.)
 *
 * Maintainers run `npm run cacert:update` manually when they choose; release
 * scripts do not auto-fetch or auto-check the bundle.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectExecution } from "./direct-execution.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outPath = path.join(root, "assets", "cacert.pem");
const sourceUrl = "https://curl.se/ca/cacert.pem";
const sha256SidecarUrl = `${sourceUrl}.sha256`;
const checkOnly = process.argv.includes("--check");
const fetchHeaders = { "User-Agent": "Dacx-cacert-update/1.0" };

function normalizeLf(text) {
  return text.replace(/\r\n/g, "\n");
}

function readHeaderSha256(pemText) {
  const match = normalizeLf(pemText).match(/^## SHA256: ([0-9a-f]{64})\s*$/m);
  return match ? match[1].toLowerCase() : null;
}

function readMozillaDate(pemText) {
  const match = normalizeLf(pemText).match(
    /^## Certificate data from Mozilla as of: (.+)\s*$/m,
  );
  return match ? match[1].trim() : null;
}

function validatePem(pemText) {
  const normalized = normalizeLf(pemText);
  if (!normalized.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error("Download does not look like a PEM CA bundle");
  }
  const certCount = (normalized.match(/-----BEGIN CERTIFICATE-----/g) || [])
    .length;
  if (certCount < 100) {
    throw new Error(
      `Bundle has too few root certificates (${certCount}); refusing to install`,
    );
  }
  if (normalized.length < 100_000) {
    throw new Error("Bundle is suspiciously small; refusing to install");
  }
  if (!readHeaderSha256(normalized)) {
    throw new Error("PEM header is missing SHA256 checksum line");
  }
  if (!readMozillaDate(normalized)) {
    throw new Error("PEM header is missing Mozilla export date");
  }
  if (!normalized.includes("curl.se/docs/caextract.html")) {
    throw new Error("PEM header does not look like the curl.se CA extract");
  }
  return {
    certdataHash: readHeaderSha256(normalized),
    mozillaDate: readMozillaDate(normalized),
    certCount,
  };
}

function sha256OfPem(pemText) {
  let normalized = normalizeLf(pemText);
  if (!normalized.endsWith("\n")) {
    normalized += "\n";
  }
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

function parseSha256Sidecar(text) {
  const line = normalizeLf(text)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) {
    throw new Error("SHA256 sidecar is empty");
  }
  const hash = line.split(/\s+/)[0]?.toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash ?? "")) {
    throw new Error("SHA256 sidecar does not contain a valid digest");
  }
  return hash;
}

async function fetchSha256Sidecar() {
  const res = await fetch(sha256SidecarUrl, {
    redirect: "follow",
    headers: fetchHeaders,
  });
  if (!res.ok) {
    throw new Error(`GET ${sha256SidecarUrl} failed: HTTP ${res.status}`);
  }
  return parseSha256Sidecar(await res.text());
}

function verifyPemFileHash(pemText, publishedHash) {
  const fileHash = sha256OfPem(pemText);
  if (fileHash !== publishedHash) {
    throw new Error(
      `Downloaded PEM SHA256 (${fileHash}) does not match curl.se sidecar (${publishedHash})`,
    );
  }
  return fileHash;
}

async function fetchBundle() {
  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: fetchHeaders,
  });
  if (!res.ok) {
    throw new Error(`GET ${sourceUrl} failed: HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text.endsWith("\n")) {
    return `${text}\n`;
  }
  return text;
}

async function main() {
  const [remote, publishedHash] = await Promise.all([
    fetchBundle(),
    fetchSha256Sidecar(),
  ]);
  const remoteValidated = validatePem(remote);
  const remoteFileHash = verifyPemFileHash(remote, publishedHash);
  const remoteMeta = {
    fileHash: remoteFileHash,
    certdataHash: remoteValidated.certdataHash,
    date: remoteValidated.mozillaDate,
    certCount: remoteValidated.certCount,
  };

  if (!fs.existsSync(outPath)) {
    if (checkOnly) {
      console.error(`cacert check FAILED: missing ${path.relative(root, outPath)}`);
      process.exit(1);
    }
    fs.writeFileSync(outPath, remote, "utf8");
    console.log(`Wrote ${path.relative(root, outPath)} (${remoteMeta.date})`);
    return;
  }

  const local = fs.readFileSync(outPath, "utf8");
  let localMeta;
  try {
    localMeta = validatePem(local);
  } catch (e) {
    if (checkOnly) {
      console.error(`cacert check FAILED: local bundle invalid: ${e.message}`);
      process.exit(1);
    }
    fs.writeFileSync(outPath, remote, "utf8");
    console.log(`Replaced invalid local bundle (${remoteMeta.date})`);
    return;
  }

  const localFileHash = sha256OfPem(local);
  if (localFileHash === remoteMeta.fileHash) {
    console.log(
      `cacert.pem is current (Mozilla as of ${localMeta.mozillaDate ?? "unknown"}, SHA256 verified)`,
    );
    return;
  }

  if (checkOnly) {
    console.error("cacert check FAILED: bundled CA roots are stale.");
    console.error(`  local:  ${localMeta.mozillaDate} (${localFileHash})`);
    console.error(`  remote: ${remoteMeta.date} (${remoteMeta.fileHash})`);
    console.error("  Run: npm run cacert:update");
    process.exit(1);
  }

  fs.writeFileSync(outPath, remote, "utf8");
  console.log(`Updated ${path.relative(root, outPath)}`);
  console.log(`  was: ${localMeta.mozillaDate} (${localMeta.certCount} roots)`);
  console.log(`  now: ${remoteMeta.date} (${remoteMeta.certCount} roots)`);
}

export { normalizeLf, parseSha256Sidecar, sha256OfPem, validatePem };

if (isDirectExecution(import.meta.url)) {
  main().catch((err) => {
    console.error(`cacert update failed: ${err.message ?? err}`);
    process.exit(1);
  });
}
