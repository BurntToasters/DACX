import 'dart:io';

import 'package:dacx/services/tray_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TrayService.trayIconAssetPath', () {
    test('Windows uses bundled ICO (LoadImage IMAGE_ICON)', () {
      expect(
        TrayService.trayIconAssetPath(isWindows: true, isMacOS: false),
        'assets/icon/icon.ico',
      );
    });

    test('macOS uses monochrome template PNG', () {
      expect(
        TrayService.trayIconAssetPath(isWindows: false, isMacOS: true),
        'assets/icon/tray_icon_template.png',
      );
    });

    test('Linux uses full-color PNG asset', () {
      expect(
        TrayService.trayIconAssetPath(isWindows: false, isMacOS: false),
        'assets/icon/icon.png',
      );
    });

    test('matches current platform when overrides omitted', () {
      final path = TrayService.trayIconAssetPath();
      if (Platform.isWindows) {
        expect(path, endsWith('.ico'));
      } else if (Platform.isMacOS) {
        expect(path, contains('tray_icon_template'));
      } else {
        expect(path, 'assets/icon/icon.png');
      }
    });
  });
}
