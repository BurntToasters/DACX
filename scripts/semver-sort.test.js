import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compareSemverDescending,
  semverToDebianVersion,
} from "./semver-sort.js";

const packageJson = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
);
const stable = String(packageJson.version).split("+")[0].split("-")[0];
const prerelease = `${stable}-beta.4`;
const debianPrerelease = `${stable}~beta.4`;

test("maps semver prerelease hyphen to Debian tilde", () => {
  assert.equal(semverToDebianVersion(stable), stable);
  assert.equal(semverToDebianVersion(prerelease), debianPrerelease);
});

test("stable sorts above same-base prerelease for hyphen and tilde", () => {
  assert.equal(compareSemverDescending(stable, prerelease), -1);
  assert.equal(compareSemverDescending(stable, debianPrerelease), -1);
  assert.equal(compareSemverDescending(prerelease, debianPrerelease), 0);
});
