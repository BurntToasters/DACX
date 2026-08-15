import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:path/path.dart' as p;

import 'package:dacx/services/self_update_service.dart';

void main() {
  group('SelfUpdateService Windows native helper launch', () {
    test('staged helper path lives under the updates directory', () {
      const dir = r'C:\Users\dev\AppData\Local\Dacx\updates';
      expect(
        SelfUpdateService.stagedWindowsUpdateHelperPath(updatesDirectory: dir),
        p.join(dir, 'dacx-update-helper.exe'),
      );
    });

    test('stageWindowsUpdateHelper copies into updates and returns dest', () {
      SelfUpdateService.windowsHelperCopyOverride = (source, dest) {
        expect(source, r'C:\Program Files\Dacx\dacx-update-helper.exe');
        expect(dest, contains('dacx-update-helper.exe'));
      };
      addTearDown(() => SelfUpdateService.windowsHelperCopyOverride = null);
      const dir = r'C:\Users\dev\AppData\Local\Dacx\updates';
      final staged = SelfUpdateService.stageWindowsUpdateHelper(
        installedHelperPath: r'C:\Program Files\Dacx\dacx-update-helper.exe',
        updatesDirectory: dir,
      );
      expect(staged, p.join(dir, 'dacx-update-helper.exe'));
    });

    test('builds a quoted helper command line', () {
      final cmd = SelfUpdateService.buildWindowsUpdateHelperCommandLine(
        helperPath: r'C:\Program Files\Dacx\dacx-update-helper.exe',
        dacxPid: 4242,
        msiPath:
            r'C:\Users\dev\AppData\Local\Dacx\updates\Dacx-Windows-x64.msi',
        sha256:
            'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        thumbprint: 'ABCD1234',
        publisher: 'BurntToasters LLC',
        exePath: r'C:\Program Files\Dacx\dacx.exe',
        relaunch: true,
      );

      expect(cmd, contains(r'"C:\Program Files\Dacx\dacx-update-helper.exe"'));
      expect(cmd, contains('--pid 4242'));
      expect(cmd, contains('--sha256 deadbeef'));
      expect(cmd, contains('--thumbprint "ABCD1234"'));
      expect(cmd, contains('--publisher "BurntToasters LLC"'));
      expect(cmd, contains(r'--exe "C:\Program Files\Dacx\dacx.exe"'));
      expect(cmd, contains('--relaunch 1'));
      expect(cmd, contains('Dacx-Windows-x64.msi'));
    });

    test('omits --exe when path is empty but still requests relaunch', () {
      final cmd = SelfUpdateService.buildWindowsUpdateHelperCommandLine(
        helperPath: r'C:\Dacx\dacx-update-helper.exe',
        dacxPid: 1,
        msiPath: r'C:\a.msi',
        sha256:
            'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        thumbprint: '',
        exePath: '',
        relaunch: false,
      );
      expect(cmd, isNot(contains('--exe')));
      expect(cmd, contains('--relaunch 0'));
    });

    test('WMI bootstrap embeds helper command and escapes quotes', () {
      final script = SelfUpdateService.buildWindowsHelperWmiBootstrapScript(
        r'''"C:\O'Brien\dacx-update-helper.exe" --pid 1 --msi "x" --sha256 a --thumbprint ""''',
      );
      expect(script, contains('Win32_Process'));
      expect(script, contains('Invoke-CimMethod'));
      // PowerShell single-quoted string: O'Brien → O''Brien
      expect(script, contains(r"C:\O''Brien\dacx-update-helper.exe"));
    });

    test('launch command line uses EncodedCommand (no -File script path)', () {
      final encoded = SelfUpdateService.encodePowerShellCommand('exit 0');
      final cmd = SelfUpdateService.buildWindowsHelperLaunchCommandLine(
        encoded,
      );
      expect(cmd, contains('-EncodedCommand'));
      expect(cmd, contains(encoded));
      expect(cmd, isNot(contains('-File')));
      expect(cmd, isNot(contains('.ps1')));
    });

    test('encodePowerShellCommand is UTF-16LE base64', () {
      final encoded = SelfUpdateService.encodePowerShellCommand('AB');
      final bytes = base64Decode(encoded);
      expect(bytes, [0x41, 0x00, 0x42, 0x00]);
    });
  });
}
