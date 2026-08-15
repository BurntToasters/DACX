import 'package:dacx/playback/bookmark_retention_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BookmarkRetentionPolicy', () {
    test('keeps exact recents keys', () {
      expect(
        BookmarkRetentionPolicy.shouldKeepKey('/a/t.mp3', ['/a/t.mp3']),
        isTrue,
      );
    });

    test('keeps a covering directory for a recent child', () {
      expect(
        BookmarkRetentionPolicy.shouldKeepKey('/Movies/Album', [
          '/Movies/Album/track1.mp3',
        ]),
        isTrue,
      );
    });

    test('drops unrelated and orphan keys', () {
      expect(
        BookmarkRetentionPolicy.shouldKeepKey('/orphan.mp3', ['/ok.mp3']),
        isFalse,
      );
    });

    test('does not treat a sibling prefix as covering', () {
      expect(
        BookmarkRetentionPolicy.isCoveringDirectory(
          '/Movies/Al',
          '/Movies/Album/a.mp3',
        ),
        isFalse,
      );
    });

    test('coveringKey prefers exact then longest parent', () {
      expect(
        BookmarkRetentionPolicy.coveringKey('/Movies/Album/a.mp3', [
          '/Movies',
          '/Movies/Album',
          '/other',
        ]),
        '/Movies/Album',
      );
      expect(
        BookmarkRetentionPolicy.coveringKey('/Movies/Album/a.mp3', [
          '/Movies/Album/a.mp3',
          '/Movies/Album',
        ]),
        '/Movies/Album/a.mp3',
      );
    });

    test('normalizes Windows separators', () {
      expect(
        BookmarkRetentionPolicy.isCoveringDirectory(
          r'C:\Music',
          r'C:\Music\a.mp3',
        ),
        isTrue,
      );
    });
  });
}
