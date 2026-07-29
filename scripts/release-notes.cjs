const fs = require('fs');
const path = require('path');

function readReleaseNotes(root = path.resolve(__dirname, '..')) {
  return fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').trim();
}

function validateReleaseNotes(notes, version) {
  const failures = [];
  const expectedHeading = '## Changes in `v' + version + ':`';
  const firstHeadingIndex = notes.indexOf('## Changes in `v');
  const firstHeadingEnd =
    firstHeadingIndex < 0 ? notes.length : notes.indexOf('\n## Changes in `v', firstHeadingIndex + 1);
  const currentRelease =
    firstHeadingIndex < 0
      ? ''
      : notes.slice(firstHeadingIndex, firstHeadingEnd < 0 ? notes.length : firstHeadingEnd);
  const preamble = notes.slice(0, firstHeadingIndex < 0 ? notes.length : firstHeadingIndex);
  const isPrerelease = version.includes('beta') || version.includes('alpha');

  if (!notes.startsWith('> [!')) {
    failures.push('CHANGELOG.md must begin with a release notice');
  }
  if (!currentRelease.startsWith(expectedHeading)) {
    failures.push('first changelog heading must be ' + expectedHeading);
  }
  if (!preamble.includes('/releases/download/v' + version + '/')) {
    failures.push('download table does not target v' + version);
  }
  if (!isPrerelease && /This is a Beta build/i.test(preamble)) {
    failures.push('stable release notes still contain the beta-build banner');
  }
  if (version === '0.11.1') {
    if (
      !preamble.includes('v0.11.0') ||
      !preamble.includes('Open release page') ||
      !/manually once/i.test(preamble)
    ) {
      failures.push('v0.11.1 notes must preserve the v0.11.0 manual-upgrade advisory');
    }
  }

  return failures;
}

function assertValidReleaseNotes(notes, version) {
  const failures = validateReleaseNotes(notes, version);
  if (failures.length) {
    throw new Error('Invalid release notes:\n  - ' + failures.join('\n  - '));
  }
}

module.exports = {
  assertValidReleaseNotes,
  readReleaseNotes,
  validateReleaseNotes,
};
