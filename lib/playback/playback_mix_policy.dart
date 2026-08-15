/// Builds mpv `lavfi-complex` graphs for experimental multi-audio mix.
///
/// Mix is withdrawn from the UI (`userFacingEnabled` is false). Keep the
/// graph builder, PlayerScreen apply path, and stored pref. Flip this flag
/// and restore the Settings / ⋯ menu tiles when a linked libmpv has
/// `amix`/`aformat` on every shipped platform. See `docs/ideas/multi-audio-mix.md`.
abstract final class PlaybackMixPolicy {
  /// When false, Settings and the player menu must not offer mix, and
  /// [SettingsService.multiAudioMix] reports false even if a pref is stored.
  static const bool userFacingEnabled = false;

  /// Audio-only branch: format each [aidN] track and amix into [ao].
  static String buildAudioMixBranch(List<String> audioIds) {
    final buf = StringBuffer();
    for (var i = 0; i < audioIds.length; i++) {
      buf.write(
        '[aid${audioIds[i]}] '
        'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo '
        '[a${i + 1}] ; ',
      );
    }
    for (var i = 0; i < audioIds.length; i++) {
      buf.write('[a${i + 1}]');
    }
    buf.write(' amix=inputs=${audioIds.length}:normalize=0 [ao]');
    return buf.toString();
  }

  /// Full graph with optional video passthrough label [vidN].
  static String buildLavfiComplex({
    required List<String> audioIds,
    String? videoTrackId,
  }) {
    final audioChain = buildAudioMixBranch(audioIds);
    if (videoTrackId != null && videoTrackId.isNotEmpty) {
      return '[vid$videoTrackId] null [vo] ; $audioChain';
    }
    return audioChain;
  }

  /// Returns only numeric mpv audio track ids suitable for lavfi labels.
  static List<String> numericAudioIds(Iterable<String> raw) => raw
      .where((id) => id != 'auto' && id != 'no')
      .where((id) => int.tryParse(id) != null)
      .toList(growable: false);

  /// Returns only numeric mpv video track ids suitable for lavfi labels.
  static List<String> numericVideoIds(Iterable<String> raw) => raw
      .where((id) => id != 'auto' && id != 'no')
      .where((id) => int.tryParse(id) != null)
      .toList(growable: false);

  /// First real movie video id, skipping embedded cover/album-art tracks.
  static String? passthroughVideoTrackId({
    required Iterable<String> videoIds,
    required bool Function(String id) isAlbumArtOrImage,
  }) {
    for (final id in numericVideoIds(videoIds)) {
      if (!isAlbumArtOrImage(id)) return id;
    }
    return null;
  }
}

/// Tracks per-load mix cache state so IDs from one file cannot leak into the
/// next file's lavfi graph.
final class PlaybackMixLoadState {
  List<String> _audioIds = const [];
  List<String> _videoIds = const [];

  List<String> get audioIds => _audioIds;
  List<String> get videoIds => _videoIds;

  bool get canMix => _audioIds.length >= 2;

  void reset() {
    _audioIds = const [];
    _videoIds = const [];
  }

  void update({
    required Iterable<String> audioIds,
    required Iterable<String> videoIds,
  }) {
    _audioIds = PlaybackMixPolicy.numericAudioIds(audioIds);
    _videoIds = PlaybackMixPolicy.numericVideoIds(videoIds);
  }
}
