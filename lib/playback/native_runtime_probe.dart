import 'dart:ffi';
import 'dart:io';

/// Discovers libmpv the same way media_kit's NativeLibrary does.
///
/// Official AppImage / tar / Flatpak builds vendor libmpv into bundle/lib.
/// deb/rpm and `flutter run` still use the host SONAME. Probe before
/// MediaKit.ensureInitialized so Dacx can show a blocking screen instead of
/// dying on a Dart exception.
abstract final class NativeRuntimeProbe {
  /// Names media_kit tries on GNU/Linux (`native_library.dart`). Keep in sync.
  static const linuxLibmpvNames = ['libmpv.so', 'libmpv.so.2', 'libmpv.so.1'];

  /// Whether libmpv can be opened. Non-Linux always returns true (bundled).
  static bool libmpvAvailable({
    bool? isLinux,
    String? envLibraryPath,
    bool Function(String name)? tryOpen,
  }) {
    final linux = isLinux ?? Platform.isLinux;
    if (!linux) return true;
    final open = tryOpen ?? _defaultTryOpen;
    final env = envLibraryPath ?? Platform.environment['LIBMPV_LIBRARY_PATH'];
    if (env != null && env.isNotEmpty && open(env)) {
      return true;
    }
    for (final name in linuxLibmpvNames) {
      if (open(name)) return true;
    }
    return false;
  }

  static bool _defaultTryOpen(String name) {
    try {
      DynamicLibrary.open(name);
      return true;
    } catch (_) {
      return false;
    }
  }
}
