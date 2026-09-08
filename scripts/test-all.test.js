import assert from "node:assert/strict";
import { test } from "node:test";

import {
  flutterTestOutputLooksFailed,
  flutterTestOutputLooksFullyPassed,
  flutterTestRunSucceeded,
} from "./test-all.js";

test("accepts a normal flutter test success summary", () => {
  const output = "00:10 +85: All tests passed!\n";
  assert.equal(flutterTestOutputLooksFullyPassed(output), true);
  assert.equal(flutterTestOutputLooksFailed(output), false);
  assert.equal(flutterTestRunSucceeded(output, 0), true);
});

test("rejects load failures even when the process exits 0", () => {
  const output = [
    'Failed to load "test/screens/player_screen_pump_test.dart":',
    "Compilation failed",
    "00:00 +0 -2: Some tests failed.",
  ].join("\n");
  assert.equal(flutterTestOutputLooksFailed(output), true);
  assert.equal(flutterTestRunSucceeded(output, 0), false);
});

test("rejects progress lines that include a failure count", () => {
  const output =
    "00:52 +924 -1: UpdatePendingMarker writes, reads, and clears pending update marker [E]\n";
  assert.equal(flutterTestOutputLooksFailed(output), true);
  assert.equal(flutterTestRunSucceeded(output, 1), false);
});

test("rejects a zero exit without All tests passed", () => {
  const output = "00:01 +12: loading next file\n";
  assert.equal(flutterTestOutputLooksFullyPassed(output), false);
  assert.equal(flutterTestRunSucceeded(output, 0), false);
});
