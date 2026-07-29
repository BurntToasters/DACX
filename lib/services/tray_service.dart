import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:tray_manager/tray_manager.dart';
import 'package:window_manager/window_manager.dart';

/// System tray icon + menu for minimize-to-tray on desktop.
///
/// Supported on Windows, macOS, and Linux. Elsewhere all methods no-op.
class TrayService with TrayListener {
  TrayService({required this.onQuit});

  /// Called when the user chooses Quit from the tray menu.
  final Future<void> Function() onQuit;

  bool _initialized = false;
  String _showLabel = 'Show Dacx';
  String _quitLabel = 'Quit';

  static bool get isSupported =>
      !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);

  bool get isInitialized => _initialized;

  /// Bundled asset path passed to [trayManager.setIcon] (relative to flutter_assets).
  ///
  /// Windows loads icons via `LoadImage` with [IMAGE_ICON], so a multi-size `.ico`
  /// is required. macOS uses a monochrome template PNG for the menu bar.
  @visibleForTesting
  static String trayIconAssetPath({bool? isWindows, bool? isMacOS}) {
    final onWindows = isWindows ?? Platform.isWindows;
    final onMacOS = isMacOS ?? Platform.isMacOS;
    if (onWindows) {
      return 'assets/icon/icon.ico';
    }
    if (onMacOS) {
      return 'assets/icon/tray_icon_template.png';
    }
    return 'assets/icon/icon.png';
  }

  Future<void> init({
    required String showLabel,
    required String quitLabel,
  }) async {
    if (!isSupported) return;
    _showLabel = showLabel;
    _quitLabel = quitLabel;
    if (_initialized) {
      await _applyMenu();
      return;
    }
    try {
      final iconPath = trayIconAssetPath();
      if (Platform.isMacOS) {
        await trayManager.setIcon(iconPath, isTemplate: true, iconSize: 22);
      } else {
        await trayManager.setIcon(iconPath);
      }
      await trayManager.setToolTip('Dacx');
      await _applyMenu();
      trayManager.addListener(this);
      _initialized = true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Dacx: tray init failed: $e');
      }
    }
  }

  Future<void> _applyMenu() async {
    final menu = Menu(
      items: [
        MenuItem(key: 'show', label: _showLabel),
        MenuItem.separator(),
        MenuItem(key: 'quit', label: _quitLabel),
      ],
    );
    await trayManager.setContextMenu(menu);
  }

  Future<void> showWindow() async {
    if (!isSupported) return;
    try {
      await windowManager.show();
      await windowManager.focus();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Dacx: tray showWindow failed: $e');
      }
    }
  }

  Future<void> hideToTray() async {
    if (!isSupported) return;
    if (!_initialized) {
      await init(showLabel: _showLabel, quitLabel: _quitLabel);
    }
    try {
      await windowManager.hide();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Dacx: tray hideToTray failed: $e');
      }
    }
  }

  Future<void> dispose() async {
    if (!_initialized) return;
    try {
      trayManager.removeListener(this);
      await trayManager.destroy();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Dacx: tray dispose failed: $e');
      }
    }
    _initialized = false;
  }

  @override
  void onTrayIconMouseDown() {
    // Left-click: show window (macOS / Linux). Windows opens the menu.
    if (Platform.isWindows) {
      unawaited(trayManager.popUpContextMenu());
    } else {
      unawaited(showWindow());
    }
  }

  @override
  void onTrayIconRightMouseDown() {
    unawaited(trayManager.popUpContextMenu());
  }

  @override
  void onTrayMenuItemClick(MenuItem menuItem) {
    switch (menuItem.key) {
      case 'show':
        unawaited(showWindow());
      case 'quit':
        unawaited(
          onQuit().catchError((Object e) {
            if (kDebugMode) {
              debugPrint('Dacx: tray onQuit failed: $e');
            }
          }),
        );
    }
  }
}
