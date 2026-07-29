#!/usr/bin/env node
/**
 * Advisory: warn when assets/cacert.pem is older than curl.se's Mozilla extract.
 * Never fails the suite (network errors are ignored).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const script = path.join(root, "scripts", "update-cacert.js");

const r = spawnSync(process.execPath, [script, "--check"], {
  encoding: "utf8",
  windowsHide: true,
});

const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
if (r.status === 0) {
  if (out) console.log(out);
  process.exit(0);
}

if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(out)) {
  console.log("cacert advisory skipped (network unavailable).");
  process.exit(0);
}

console.log(out || "cacert.pem may be stale.");
console.log("\ncacert check is advisory; run `npm run cacert:update` before release.");
process.exit(0);
