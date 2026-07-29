const assert = require('node:assert/strict');
const test = require('node:test');

const { validateReleaseNotes } = require('./release-notes.cjs');

function notesFor(version, notice = '> [!NOTE]\n> Release notice') {
  return [
    notice,
    '',
    'https://github.com/BurntToasters/Dacx/releases/download/v' + version + '/Dacx-Windows-x64.msi',
    '',
    '## Changes in `v' + version + ':`',
    '',
    '- Fix.',
    '',
    '## Changes in `v0.1.0:`',
  ].join('\n');
}

test('accepts notes whose first release and downloads match the package version', () => {
  assert.deepEqual(validateReleaseNotes(notesFor('0.12.0'), '0.12.0'), []);
});

test('rejects stale release headings and download links', () => {
  const failures = validateReleaseNotes(notesFor('0.11.1-beta.2'), '0.11.1');
  assert.equal(failures.some((failure) => failure.includes('first changelog heading')), true);
  assert.equal(failures.some((failure) => failure.includes('download table')), true);
});

test('rejects a beta banner for stable release notes', () => {
  const failures = validateReleaseNotes(
    notesFor('0.12.0', '> [!NOTE]\n> This is a Beta build.'),
    '0.12.0',
  );
  assert.equal(failures.some((failure) => failure.includes('beta-build banner')), true);
});

test('ignores a historical beta banner inside an HTML comment', () => {
  const notes = [
    '<!-- > [!NOTE]',
    '> This is a Beta build. -->',
    notesFor('0.12.0', '> [!IMPORTANT]\n> Stable release'),
  ].join('\n');
  assert.deepEqual(validateReleaseNotes(notes, '0.12.0'), []);
});

test('requires the one-time v0.11.0 recovery advisory in v0.11.1 notes', () => {
  const failures = validateReleaseNotes(notesFor('0.11.1'), '0.11.1');
  assert.equal(failures.some((failure) => failure.includes('manual-upgrade advisory')), true);
});
