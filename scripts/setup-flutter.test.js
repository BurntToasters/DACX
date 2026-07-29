import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildFvmUseArgs,
  parseFlutterFrameworkVersion,
} from './setup-flutter.js';

test('FVM switch skips implicit pub get until pinned SDK passes health check', () => {
  assert.deepEqual(buildFvmUseArgs('3.44.5'), [
    'use',
    '3.44.5',
    '--force',
    '--skip-pub-get',
  ]);
});

test('reads exact pinned Flutter version from machine output', () => {
  assert.equal(
    parseFlutterFrameworkVersion(
      JSON.stringify({ frameworkVersion: '3.44.5' }),
    ),
    '3.44.5',
  );
  assert.equal(parseFlutterFrameworkVersion('not json'), null);
});
