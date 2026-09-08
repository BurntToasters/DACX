import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertLibmpvVendored,
  collectCopyPlan,
  isSystemLib,
  parseLddOutput,
} from "./bundle-linux-native-libs.js";

test("treats glibc, GTK, and GPU driver libs as system", () => {
  assert.equal(isSystemLib("libc.so.6"), true);
  assert.equal(isSystemLib("libstdc++.so.6"), true);
  assert.equal(isSystemLib("libgtk-3.so.0"), true);
  assert.equal(isSystemLib("libGL.so.1"), true);
  assert.equal(isSystemLib("libnvidia-glcore.so.1"), true);
  assert.equal(isSystemLib("ld-linux-x86-64.so.2"), true);
});

test("does not treat libmpv or FFmpeg as system", () => {
  assert.equal(isSystemLib("libmpv.so.2"), false);
  assert.equal(isSystemLib("libavcodec.so.61"), false);
  assert.equal(isSystemLib("libayatana-appindicator3.so.1"), false);
  assert.equal(isSystemLib("libass.so.9"), false);
});

test("parseLddOutput maps sonames, skips vdso, flags not-found", () => {
  const deps = parseLddOutput(`
	linux-vdso.so.1 (0x00007ffe)
	libmpv.so.2 => /lib/x86_64-linux-gnu/libmpv.so.2 (0x0001)
	libavcodec.so.61 => /lib/x86_64-linux-gnu/libavcodec.so.61 (0x0002)
	libmissing.so.1 => not found
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x0003)
	/lib64/ld-linux-x86-64.so.2 (0x0004)
`);
  assert.deepEqual(
    deps.map((d) => d.soname),
    [
      "libmpv.so.2",
      "libavcodec.so.61",
      "libmissing.so.1",
      "libc.so.6",
      "ld-linux-x86-64.so.2",
    ],
  );
  assert.equal(
    deps.find((d) => d.soname === "libmpv.so.2").resolved,
    "/lib/x86_64-linux-gnu/libmpv.so.2",
  );
  assert.equal(deps.find((d) => d.soname === "libmissing.so.1").resolved, null);
});

test("collectCopyPlan walks ldd, skips system and already-bundled names", () => {
  const lddMap = {
    "/bundle/dacx": `
	libflutter_linux_gtk.so => /bundle/lib/libflutter_linux_gtk.so (0x1)
	libmpv.so.2 => /usr/lib/libmpv.so.2 (0x2)
	libc.so.6 => /lib/libc.so.6 (0x3)
`,
    "/usr/lib/libmpv.so.2": `
	libavcodec.so.61 => /usr/lib/libavcodec.so.61 (0x1)
	libc.so.6 => /lib/libc.so.6 (0x2)
`,
    "/usr/lib/libavcodec.so.61": `
	libc.so.6 => /lib/libc.so.6 (0x1)
`,
  };
  const plan = collectCopyPlan({
    seeds: ["/bundle/dacx"],
    existingNames: ["libflutter_linux_gtk.so"],
    ldd: (file) => lddMap[file] || "",
  });
  assert.deepEqual(
    plan.toCopy.map((e) => e.soname).sort(),
    ["libavcodec.so.61", "libmpv.so.2"],
  );
  assert.deepEqual(plan.missing, []);
});

test("collectCopyPlan records unresolved non-system deps", () => {
  const plan = collectCopyPlan({
    seeds: ["/plugin.so"],
    existingNames: [],
    ldd: () => "\tlibmpv.so.2 => not found\n",
  });
  assert.deepEqual(plan.toCopy, []);
  assert.deepEqual(plan.missing, ["libmpv.so.2"]);
});

test("assertLibmpvVendored accepts a copy plan or an already-bundled SONAME", () => {
  assert.doesNotThrow(() =>
    assertLibmpvVendored({
      existingNames: [],
      toCopy: [{ soname: "libmpv.so.2", source: "/usr/lib/libmpv.so.2" }],
    }),
  );
  assert.doesNotThrow(() =>
    assertLibmpvVendored({
      existingNames: ["libmpv.so.2"],
      toCopy: [],
    }),
  );
  assert.throws(
    () => assertLibmpvVendored({ existingNames: ["libfoo.so"], toCopy: [] }),
    /libmpv\.so\.2/,
  );
});
