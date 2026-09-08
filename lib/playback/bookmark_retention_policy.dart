/// Rules for keeping macOS security-scoped bookmarks that cover a directory
/// of files, not only exact recents keys.
abstract final class BookmarkRetentionPolicy {
  static String normalize(String path) {
    var value = path.trim().replaceAll('\\', '/');
    while (value.length > 1 && value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    return value;
  }

  /// True when [directory] is [file] or a parent of [file].
  static bool isCoveringDirectory(String directory, String file) {
    final dir = normalize(directory);
    final path = normalize(file);
    if (dir.isEmpty || path.isEmpty) return false;
    if (path == dir) return true;
    return path.startsWith('$dir/');
  }

  static bool shouldKeepKey(String bookmarkKey, Iterable<String> keepPaths) {
    final key = bookmarkKey.trim();
    if (key.isEmpty) return false;
    for (final keep in keepPaths) {
      if (keep.trim().isEmpty) continue;
      if (isCoveringDirectory(key, keep)) return true;
    }
    return false;
  }

  /// Exact key if present, otherwise the longest covering directory key.
  static String? coveringKey(String filePath, Iterable<String> bookmarkKeys) {
    final path = filePath.trim();
    if (path.isEmpty) return null;
    String? best;
    for (final raw in bookmarkKeys) {
      final key = raw.trim();
      if (key.isEmpty) continue;
      if (normalize(key) == normalize(path)) return key;
      if (isCoveringDirectory(key, path)) {
        if (best == null || key.length > best.length) best = key;
      }
    }
    return best;
  }
}
