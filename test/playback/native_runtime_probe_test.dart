import 'package:dacx/playback/native_runtime_probe.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NativeRuntimeProbe.libmpvAvailable', () {
    test('non-Linux is always ready', () {
      expect(
        NativeRuntimeProbe.libmpvAvailable(
          isLinux: false,
          tryOpen: (_) => fail('should not open on non-Linux'),
        ),
        isTrue,
      );
    });

    test('Linux succeeds when a default SONAME opens', () {
      expect(
        NativeRuntimeProbe.libmpvAvailable(
          isLinux: true,
          envLibraryPath: '',
          tryOpen: (name) => name == 'libmpv.so.2',
        ),
        isTrue,
      );
    });

    test('Linux succeeds when LIBMPV_LIBRARY_PATH opens', () {
      expect(
        NativeRuntimeProbe.libmpvAvailable(
          isLinux: true,
          envLibraryPath: '/opt/lib/libmpv.so',
          tryOpen: (name) => name == '/opt/lib/libmpv.so',
        ),
        isTrue,
      );
    });

    test(
      'Linux falls through when env path fails then a default name works',
      () {
        expect(
          NativeRuntimeProbe.libmpvAvailable(
            isLinux: true,
            envLibraryPath: '/missing/libmpv.so',
            tryOpen: (name) => name == 'libmpv.so.1',
          ),
          isTrue,
        );
      },
    );

    test('Linux is missing when nothing opens', () {
      expect(
        NativeRuntimeProbe.libmpvAvailable(
          isLinux: true,
          envLibraryPath: '/missing/libmpv.so',
          tryOpen: (_) => false,
        ),
        isFalse,
      );
    });
  });
}
