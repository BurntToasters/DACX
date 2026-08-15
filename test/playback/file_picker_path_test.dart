import 'package:dacx/playback/file_picker_path.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FilePickerPath.fromPlatformFilePath', () {
    test('returns trimmed local paths', () {
      expect(
        FilePickerPath.fromPlatformFilePath('  /tmp/a.mp3  '),
        '/tmp/a.mp3',
      );
    });

    test('returns null for missing paths', () {
      expect(FilePickerPath.fromPlatformFilePath(null), isNull);
      expect(FilePickerPath.fromPlatformFilePath(''), isNull);
      expect(FilePickerPath.fromPlatformFilePath('   '), isNull);
    });
  });

  group('FilePickerPath.fromSaveUri', () {
    test('converts file URIs to filesystem paths', () {
      expect(
        FilePickerPath.fromSaveUri(Uri.file('/tmp/playlist.m3u')),
        '/tmp/playlist.m3u',
      );
    });

    test('accepts schemeless absolute paths from desktop plugins', () {
      expect(
        FilePickerPath.fromSaveUri(Uri.parse('/tmp/playlist.m3u')),
        '/tmp/playlist.m3u',
      );
    });

    test('returns null for missing or non-local URIs', () {
      expect(FilePickerPath.fromSaveUri(null), isNull);
      expect(
        FilePickerPath.fromSaveUri(Uri.parse('https://example.test/a')),
        isNull,
      );
      expect(FilePickerPath.fromSaveUri(Uri.parse('')), isNull);
    });
  });
}
