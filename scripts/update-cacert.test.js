import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  normalizeLf,
  parseSha256Sidecar,
  sha256OfPem,
} from "./update-cacert.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("parseSha256Sidecar accepts curl.se sha256sum format", () => {
  const hash =
    "3ff344e30b9b1ed2971044eabb438a08f2e2245ddb5f8ab1a3ad8b63ab4eaf91";
  assert.equal(
    parseSha256Sidecar(`${hash}  cacert.pem\n`),
    hash,
  );
  assert.equal(parseSha256Sidecar(`${hash.toUpperCase()}  cacert.pem`), hash);
});

test("sha256OfPem normalizes CRLF and trailing newline", () => {
  const lf = "line\n";
  const crlf = "line\r\n";
  assert.equal(sha256OfPem(lf), sha256OfPem(crlf));
  assert.equal(sha256OfPem("x"), sha256OfPem("x\n"));
});

test("normalizeLf is idempotent for LF input", () => {
  const text = "## SHA256: ab\n-----BEGIN CERTIFICATE-----\n";
  assert.equal(normalizeLf(text), normalizeLf(normalizeLf(text)));
});

test("update-cacert.js and check-cacert.js pass node --check", () => {
  for (const name of ["update-cacert.js", "check-cacert.js"]) {
    const file = path.join(root, "scripts", name);
    const r = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    assert.equal(
      r.status,
      0,
      `${name} syntax check failed: ${r.stderr || r.stdout}`,
    );
  }
});
