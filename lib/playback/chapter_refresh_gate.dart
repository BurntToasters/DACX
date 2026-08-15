/// Skips redundant mpv chapter-list property reads when file/count unchanged.
class ChapterRefreshGate {
  String? _path;
  int? _count;

  void invalidate() {
    _path = null;
    _count = null;
  }

  /// Returns true when chapter metadata should be re-fetched.
  ///
  /// Does not record [path]/[chapterCount] until [markFetched] after a
  /// successful property read, so a failed fetch can retry.
  bool shouldRefresh({required String? path, required int chapterCount}) {
    return path != _path || chapterCount != _count;
  }

  void markFetched({required String? path, required int chapterCount}) {
    _path = path;
    _count = chapterCount;
  }
}
