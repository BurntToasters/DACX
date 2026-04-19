import { existsSync, readFileSync } from 'node:fs';

const DOTENV_PATH = '.env';
const DEFAULT_XCODE_DEVELOPER_DIR = '/Applications/Xcode.app/Contents/Developer';

function stripWrappingQuotes(value) {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
    return value.slice(1, -1);
  }
  return value;
}

function parseDotEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const eq = trimmed.indexOf('=');
  if (eq <= 0) return null;

  const key = trimmed.slice(0, eq).trim();
  if (!key) return null;

  const rawValue = trimmed.slice(eq + 1).trim();
  return { key, value: stripWrappingQuotes(rawValue) };
}

export function loadLocalDotEnv() {
  if (!existsSync(DOTENV_PATH)) return;

  const content = readFileSync(DOTENV_PATH, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseDotEnvLine(line);
    if (!parsed) continue;
    if (process.env[parsed.key] !== undefined) continue;
    process.env[parsed.key] = parsed.value;
  }
}

export function normalizeXcodeDir(pathValue) {
  const value = (pathValue ?? '').trim();
  if (!value) return '';
  if (value.endsWith('/Contents/Developer')) return value;
  if (value.endsWith('.app')) return `${value}/Contents/Developer`;
  return value;
}

export function resolveDeveloperDir() {
  const envDeveloperDir = (process.env.DEVELOPER_DIR ?? '').trim();
  const envXcodeDirRaw = (process.env.XCODE_DIR ?? '').trim();
  const envXcodeDirNormalized = normalizeXcodeDir(envXcodeDirRaw);

  if (envDeveloperDir) {
    return {
      effectiveDeveloperDir: envDeveloperDir,
      source: 'DEVELOPER_DIR',
      xcodeDirRaw: envXcodeDirRaw,
      xcodeDirNormalized: envXcodeDirNormalized,
    };
  }

  if (envXcodeDirNormalized) {
    return {
      effectiveDeveloperDir: envXcodeDirNormalized,
      source: 'XCODE_DIR',
      xcodeDirRaw: envXcodeDirRaw,
      xcodeDirNormalized: envXcodeDirNormalized,
    };
  }

  if (hasXcodebuildBinary(DEFAULT_XCODE_DEVELOPER_DIR)) {
    return {
      effectiveDeveloperDir: DEFAULT_XCODE_DEVELOPER_DIR,
      source: 'default',
      xcodeDirRaw: '',
      xcodeDirNormalized: DEFAULT_XCODE_DEVELOPER_DIR,
    };
  }

  return {
    effectiveDeveloperDir: '',
    source: '',
    xcodeDirRaw: '',
    xcodeDirNormalized: '',
  };
}

export function hasXcodebuildBinary(developerDir) {
  const dir = (developerDir ?? '').trim();
  if (!dir) return false;
  return existsSync(`${dir}/usr/bin/xcodebuild`);
}
