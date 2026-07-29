#!/usr/bin/env node

const packageJson = require('../package.json');
const {
  assertValidReleaseNotes,
  readReleaseNotes,
} = require('./release-notes.cjs');

const notes = readReleaseNotes();
assertValidReleaseNotes(notes, packageJson.version);
console.log('Release notes OK (' + packageJson.version + ').');
