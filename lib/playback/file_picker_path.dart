/// Local filesystem paths from file_picker 12 `PlatformFile` / save `Uri`.
abstract final class FilePickerPath {
  /// Absolute path from a picked file, or null if it is not a local file.
  static String? fromPlatformFilePath(String? path) {
    final trimmed = path?.trim();
    if (trimmed == null || trimmed.isEmpty) return null;
    return trimmed;
  }

  /// Converts a [FilePicker.saveFile] result to a local path.
  ///
  /// Desktop plugins may return a `file:` URI or a bare path string parsed as
  /// a schemeless URI.
  static String? fromSaveUri(Uri? uri) {
    if (uri == null) return null;
    if (uri.scheme == 'file') {
      try {
        final path = uri.toFilePath().trim();
        return path.isEmpty ? null : path;
      } on UnsupportedError {
        return null;
      }
    }
    if (uri.scheme.isEmpty) {
      final path = uri.path.trim();
      return path.isEmpty ? null : path;
    }
    return null;
  }
}
