#!/usr/bin/env node

/**
 * Generate all platform app icons from a single source PNG.
 *
 * Requires: ImageMagick 7+ (`magick` command).
 *
 * Source:  assets/icon/icon.png  (1024×1024 recommended)
 *
 * Outputs:
 *   Windows: assets/icon/icon.ico  (multi-size ICO from icon.png)
 *            windows/runner/resources/app_icon.ico  (copy: exe, MSI, tray)
 *   macOS:   macos/Runner/Assets.xcassets/AppIcon.appiconset/app_icon_*.png
 *           assets/icon/tray_icon_template.png  (menu bar template)
 *   Linux:   linux/packaging/icons/  (hicolor sizes)
 */

import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SOURCE = path.join(root, "assets", "icon", "icon.png");

// ── Helpers ──────────────────────────────────────────────────

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hasMagick() {
  try {
    execSync(
      process.platform === "win32" ? "where magick" : "command -v magick",
      { stdio: "ignore" },
    );
    return true;
  } catch {
    return false;
  }
}

// Windows: multi-size .ico via ImageMagick (exe, installer, system tray)

/** @type {number[]} DPI-friendly sizes for Windows 10/11 shell + tray */
const WIN_ICO_SIZES = [16, 20, 24, 32, 40, 48, 64, 128, 256];

function magickWindowsIcoCommand(outPath) {
  if (process.platform === "win32") {
    const layers = WIN_ICO_SIZES.map(
      (s) => `( "${SOURCE}" -resize ${s}x${s} )`,
    ).join(" ");
    return `magick ${layers} "${outPath}"`;
  }
  const layers = WIN_ICO_SIZES.map(
    (s) => `\\( "${SOURCE}" -resize ${s}x${s} \\)`,
  ).join(" ");
  return `magick ${layers} "${outPath}"`;
}

function generateWindows() {
  console.log("\n── Windows ──");
  const canonical = path.join(root, "assets", "icon", "icon.ico");
  const runnerIco = path.join(
    root,
    "windows",
    "runner",
    "resources",
    "app_icon.ico",
  );
  ensureDir(path.dirname(canonical));
  ensureDir(path.dirname(runnerIco));
  run(magickWindowsIcoCommand(canonical));
  fs.copyFileSync(canonical, runnerIco);
  console.log(`  ✓ ${path.relative(root, canonical)}`);
  console.log(
    `  ✓ ${path.relative(root, runnerIco)} (Runner.rc + WiX; same bytes as icon.ico)`,
  );
}

// macOS: individual PNGs for AppIcon.appiconset

function generateMacOS() {
  console.log("\n── macOS ──");
  const outDir = path.join(
    root,
    "macos",
    "Runner",
    "Assets.xcassets",
    "AppIcon.appiconset",
  );
  ensureDir(outDir);

  // Sizes needed by Contents.json (unique pixel sizes)
  const sizes = [16, 32, 64, 128, 256, 512, 1024];

  for (const s of sizes) {
    const outFile = path.join(outDir, `app_icon_${s}.png`);
    run(`magick "${SOURCE}" -resize ${s}x${s} "${outFile}"`);
    console.log(`  ✓ app_icon_${s}.png`);
  }
}

// macOS menu bar: black template PNG (transparent background)

function generateTrayTemplate() {
  console.log("\n── macOS tray template ──");
  const out = path.join(root, "assets", "icon", "tray_icon_template.png");
  ensureDir(path.dirname(out));
  // Flood-fill the app-icon background, then force RGB to black (keep alpha).
  const floodfill =
    '-fuzz 22% -fill none -draw "color 64,10 floodfill" ' +
    "-channel RGB -evaluate set 0 +channel";
  if (process.platform === "win32") {
    run(`magick "${SOURCE}" -resize 128x128 ${floodfill} "${out}"`);
  } else {
    run(`magick "${SOURCE}" -resize 128x128 ${floodfill} "${out}"`);
  }
  console.log(`  ✓ ${path.relative(root, out)}`);
}

// Linux: hicolor icon theme PNGs

function generateLinux() {
  console.log("\n── Linux ──");
  const sizes = [16, 32, 48, 64, 128, 256, 512];

  for (const s of sizes) {
    const outDir = path.join(
      root,
      "linux",
      "packaging",
      "icons",
      "hicolor",
      `${s}x${s}`,
      "apps",
    );
    ensureDir(outDir);
    const outFile = path.join(outDir, "dacx.png");
    run(`magick "${SOURCE}" -resize ${s}x${s} "${outFile}"`);
    console.log(`  ✓ ${s}x${s}/apps/dacx.png`);
  }
}

// macOS: document type icns

function generateMacOSDocumentIcons() {
  console.log("\n── macOS document icons ──");
  if (process.platform !== "darwin") {
    console.log("  (skipped: requires macOS iconutil)");
    return;
  }

  const docs = [
    {
      source: path.join(root, "assets", "dacx_music_icon.png"),
      out: path.join(root, "macos", "Runner", "dacx_music_icon.icns"),
      label: "dacx_music_icon",
    },
  ];

  const sizes = [
    [16, "icon_16x16.png"],
    [32, "icon_16x16@2x.png"],
    [32, "icon_32x32.png"],
    [64, "icon_32x32@2x.png"],
    [128, "icon_128x128.png"],
    [256, "icon_128x128@2x.png"],
    [256, "icon_256x256.png"],
    [512, "icon_256x256@2x.png"],
    [512, "icon_512x512.png"],
    [1024, "icon_512x512@2x.png"],
  ];

  for (const doc of docs) {
    if (!fs.existsSync(doc.source)) {
      console.warn(`  ! missing source: ${path.relative(root, doc.source)}`);
      continue;
    }
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), `${doc.label}-`),
    ) + ".iconset";
    fs.mkdirSync(tmpDir, { recursive: true });
    for (const [sz, name] of sizes) {
      run(`sips -z ${sz} ${sz} "${doc.source}" --out "${path.join(tmpDir, name)}" >/dev/null`);
    }
    run(`iconutil -c icns "${tmpDir}" -o "${doc.out}"`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`  ✓ ${path.relative(root, doc.out)}`);
  }
}

// ── Main ─────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source icon not found: ${SOURCE}`);
    console.error("Place a 1024×1024 PNG at assets/icon/icon.png");
    process.exit(1);
  }

  if (!hasMagick()) {
    console.error("ImageMagick 7+ (magick) is required but not found.");
    console.error("Install it:");
    console.error("  Windows:  winget install ImageMagick.ImageMagick");
    console.error("  macOS:    brew install imagemagick");
    console.error("  Linux:    sudo apt install imagemagick");
    process.exit(1);
  }

  console.log(`Source: ${path.relative(root, SOURCE)}`);

  generateWindows();
  generateMacOS();
  generateTrayTemplate();
  generateMacOSDocumentIcons();
  generateLinux();

  console.log("\n✔ All platform icons generated.");
}

main();
