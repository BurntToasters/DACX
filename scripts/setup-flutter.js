// Ensures fvm is installed and the Flutter version pinned in .fvmrc is
// available locally. Safe to run on dev machines and CI/release VMs; exits
// quickly when already in sync.

import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { homedir } from 'node:os';
import crossSpawn from 'cross-spawn';
import { isDirectExecution } from './direct-execution.js';

// Pub installs global executables here; fvm lands here after activation.
// We prepend this to PATH for child processes so `fvm` resolves even on
// fresh machines where the user hasn't manually added it.
function pubBinDir() {
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'),
      'Pub', 'Cache', 'bin');
  }
  return join(homedir(), '.pub-cache', 'bin');
}

const childEnv = {
  ...process.env,
  PATH: `${pubBinDir()}${delimiter}${process.env.PATH || ''}`,
};

function run(cmd, args, opts = {}) {
  const result = crossSpawn.sync(cmd, args, {
    stdio: 'inherit',
    env: childEnv,
    windowsHide: true,
    ...opts,
  });
  if (result.error) throw result.error;
  if ((result.status ?? 1) !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with ${result.status}`);
  }
  return result;
}

function capture(cmd, args, { allowFailure = false } = {}) {
  const result = crossSpawn.sync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: childEnv,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  const combined = `${stdout}\n${stderr}`.trim();
  if ((result.status ?? 1) !== 0 && !allowFailure) {
    throw new Error(combined || `${cmd} ${args.join(' ')} exited with ${result.status}`);
  }
  return { status: result.status ?? 1, stdout, stderr, combined };
}

function captureText(cmd, args, opts) {
  const { combined, status } = capture(cmd, args, opts);
  if (status !== 0 && !opts?.allowFailure) {
    throw new Error(combined || `${cmd} ${args.join(' ')} exited with ${status}`);
  }
  return combined;
}

function dartKernelMismatch(text) {
  return /Invalid kernel binary format version/i.test(text);
}

export function buildFvmUseArgs(version) {
  return ['use', version, '--force', '--skip-pub-get'];
}

export function parseFlutterFrameworkVersion(machineOutput) {
  try {
    const parsed = JSON.parse(machineOutput);
    const version = parsed.frameworkVersion ?? parsed.flutterVersion;
    return typeof version === 'string' && version.trim() ? version.trim() : null;
  } catch {
    return null;
  }
}

function has(cmd) {
  const result = crossSpawn.sync(
    process.platform === 'win32' ? 'where' : 'which',
    [cmd],
    { stdio: 'ignore', env: childEnv, windowsHide: true },
  );
  return result.status === 0;
}

/** Stable VS Code path; FVM retargets `.fvm/flutter_sdk` on each `fvm use`. */
const VSCODE_FLUTTER_SDK = '.fvm/flutter_sdk';

function syncVscodeFlutterSdkPath() {
  const dir = join(process.cwd(), '.vscode');
  const file = join(dir, 'settings.json');
  if (!existsSync(dir)) return;

  let settings = {};
  if (existsSync(file)) {
    try {
      settings = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      console.warn('⚠  Could not parse .vscode/settings.json; skipping SDK path sync');
      return;
    }
  }

  if (settings['dart.flutterSdkPath'] === VSCODE_FLUTTER_SDK) return;

  settings['dart.flutterSdkPath'] = VSCODE_FLUTTER_SDK;
  writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  console.log(`✓ VS Code Flutter SDK path → ${VSCODE_FLUTTER_SDK}`);
}

function ensurePinnedSdkHealthy(version) {
  const probe = () => {
    const flutter = capture('fvm', ['flutter', '--version', '--machine'], {
      allowFailure: true,
    });
    const dart = capture('fvm', ['dart', '--version'], { allowFailure: true });
    const resolvedVersion = parseFlutterFrameworkVersion(flutter.stdout);
    const broken =
      flutter.status !== 0 ||
      dart.status !== 0 ||
      dartKernelMismatch(flutter.combined) ||
      dartKernelMismatch(dart.combined) ||
      resolvedVersion !== version;
    const mismatch =
      resolvedVersion && resolvedVersion !== version
        ? `Expected Flutter ${version}, but FVM resolved ${resolvedVersion}.`
        : '';
    return {
      broken,
      detail: [mismatch, flutter.combined || dart.combined]
        .filter(Boolean)
        .join('\n'),
    };
  };

  let { broken, detail } = probe();
  if (!broken) {
    console.log('✓ Pinned Flutter/Dart SDK responds cleanly');
    return;
  }

  console.log('▶ Pinned SDK health check failed; reinstalling cached Flutter');
  if (detail) {
    console.log(`   ${detail.split('\n').slice(0, 3).join('\n   ')}`);
  }

  run('fvm', ['remove', version]);
  run('fvm', ['install', version]);
  run('fvm', buildFvmUseArgs(version));
  syncVscodeFlutterSdkPath();

  ({ broken, detail } = probe());
  if (broken) {
    console.error('');
    console.error('✖ FVM Flutter SDK still unhealthy after reinstall.');
    console.error(
      '  Try: dart pub global activate fvm && npm run setup:flutter',
    );
    console.error('  Or install Flutter manually and run `fvm use` in this repo.');
    if (detail) console.error(`  Last output: ${detail}`);
    process.exit(1);
  }
  console.log('✓ Reinstalled pinned Flutter/Dart SDK');
}

function ensurePubBinOnPath() {
  const bin = pubBinDir();
  const userPath = process.env.PATH || '';
  const alreadyOnPath =
    process.platform === 'win32'
      ? userPath
          .split(delimiter)
          .some((p) => p.toLowerCase() === bin.toLowerCase())
      : userPath.split(delimiter).includes(bin);
  if (alreadyOnPath) {
    return;
  }
  if (process.env.CI) {
    // CI workflows handle PATH via GITHUB_PATH / equivalents.
    return;
  }
  try {
    if (process.platform === 'win32') {
      addToWindowsUserPath(bin);
    } else {
      addToShellRc(bin);
    }
  } catch (e) {
    console.log('');
    console.log('⚠  Could not auto-add to PATH; do it manually:');
    console.log(`     ${bin}`);
    console.log(`   Reason: ${e.message ?? e}`);
  }
}

function addToWindowsUserPath(bin) {
  // Use User-scope SetEnvironmentVariable via PowerShell; no admin needed,
  // persists across shells, idempotent guard avoids duplicate entries.
  const psCmd =
    `$bin = '${bin.replace(/'/g, "''")}'; ` +
    `$current = [Environment]::GetEnvironmentVariable('Path','User'); ` +
    `if ($current -split ';' | Where-Object { $_ -ieq $bin }) { 'already' } ` +
    `else { [Environment]::SetEnvironmentVariable('Path', ($current + ';' + $bin), 'User'); 'added' }`;
  const result = execSync(`powershell -NoProfile -Command "${psCmd}"`, {
    encoding: 'utf8',
  }).trim();
  if (result === 'added') {
    console.log('');
    console.log(`✓ Added to User PATH: ${bin}`);
    console.log('  Restart your shell to pick it up in this session.');
  }
}

function addToShellRc(bin) {
  // Append to whichever rc files exist for the user's likely shells. macOS
  // defaults to zsh and sources .zprofile for login shells (SSH) + .zshrc for
  // interactive; most Linux distros default to bash; I also added fish because I use it.
  const home = homedir();
  const targets = [
    join(home, '.zprofile'),
    join(home, '.zshrc'),
    join(home, '.bashrc'),
    join(home, '.bash_profile'),
    join(home, '.profile'),
    join(home, '.config', 'fish', 'config.fish'),
  ].filter((p) => existsSync(p));

  if (targets.length === 0) {
    targets.push(join(home, '.profile'));
  }

  const marker = '# Added by dacx setup:flutter: fvm bin';
  let wrote = false;
  for (const file of targets) {
    const isFish = file.endsWith('config.fish');
    const line = isFish
      ? `set -gx PATH "${bin}" $PATH`
      : `export PATH="${bin}:$PATH"`;
    const existing = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (existing.includes(marker) || existing.includes(line)) continue;
    appendFileSync(file, `\n${marker}\n${line}\n`);
    console.log(`✓ Appended PATH update to ${file}`);
    wrote = true;
  }
  if (wrote) {
    console.log('  Open a new shell (or source the file) to pick up `fvm`.');
  }
}

function main() {
  const fvmrcPath = join(process.cwd(), '.fvmrc');
  if (!existsSync(fvmrcPath)) {
    console.error('✖ .fvmrc not found. Run `fvm use <version>` first to pin Flutter.');
    process.exit(1);
  }

  let pinned = '';
  try {
    pinned = JSON.parse(readFileSync(fvmrcPath, 'utf8')).flutter;
  } catch (e) {
    console.error(`✖ Could not parse .fvmrc: ${e.message ?? e}`);
    process.exit(1);
  }
  if (!pinned) {
    console.error('✖ .fvmrc has no `flutter` field.');
    process.exit(1);
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pinned)) {
    console.error(`✖ .fvmrc flutter version is not a valid pinned version: "${pinned}"`);
    process.exit(1);
  }

  console.log(`Pinned Flutter version: ${pinned}`);

  if (!has('fvm')) {
    console.log('▶ fvm not found; installing via `dart pub global activate fvm`');
    run('dart', ['pub', 'global', 'activate', 'fvm']);
  } else {
    const fvmProbe = capture('fvm', ['--version'], { allowFailure: true });
    if (fvmProbe.status !== 0 || dartKernelMismatch(fvmProbe.combined)) {
      console.log(
        '▶ Repairing global fvm (Dart SDK / kernel mismatch on the fvm CLI)',
      );
      run('dart', ['pub', 'global', 'activate', 'fvm']);
    }
  }

  console.log(`▶ Ensuring Flutter ${pinned} is installed via fvm`);
  run('fvm', ['install', pinned]);

  console.log(`▶ Pinning project to Flutter ${pinned}`);
  run('fvm', buildFvmUseArgs(pinned));
  syncVscodeFlutterSdkPath();

  ensurePinnedSdkHealthy(pinned);

  console.log('▶ Resolving Dart/Flutter package graph and regenerating l10n');
  run('fvm', ['flutter', 'pub', 'get']);
  run('fvm', ['flutter', 'gen-l10n']);

  ensurePubBinOnPath();
  console.log(`✓ fvm flutter pinned to ${pinned} and ready`);
}

if (isDirectExecution(import.meta.url)) {
  main();
}
