import 'package:path/path.dart' as p;

/// Pure screenshot filename/path rules extracted from [PlayerScreen].
abstract final class ScreenshotPathPolicy {
  static String mimeForFormat(String format) =>
      format == 'png' ? 'image/png' : 'image/jpeg';

  static String sanitizeBaseName(String raw) {
    return raw
        .replaceAll(RegExp(r'[\\/:*?"<>|]+'), '_')
        .trim()
        .replaceAll(RegExp(r'\s+'), '_');
  }

  static String baseNameForSource({
    required bool isFile,
    required String sourceValue,
    required String displayName,
  }) {
    final raw = isFile ? p.basenameWithoutExtension(sourceValue) : displayName;
    final sanitized = sanitizeBaseName(raw);
    return sanitized.isEmpty ? 'dacx' : sanitized;
  }

  static String timestampToken(DateTime timestamp) {
    return timestamp
        .toIso8601String()
        .replaceAll(':', '-')
        .replaceAll('.', '-');
  }

  static String buildOutputPath({
    required String directory,
    required String baseName,
    required String format,
    required DateTime timestamp,
  }) {
    final token = timestampToken(timestamp);
    return p.join(directory, '${baseName}_$token.$format');
  }

  /// Avoids same-timestamp overwrites by appending `-2`, `-3`, …
  static String uniqueOutputPath({
    required String path,
    required bool Function(String candidate) exists,
  }) {
    if (!exists(path)) return path;
    final dir = p.dirname(path);
    final ext = p.extension(path);
    final stem = p.basenameWithoutExtension(path);
    for (var i = 2; i < 1000; i++) {
      final next = p.join(dir, '$stem-$i$ext');
      if (!exists(next)) return next;
    }
    return path;
  }
}
