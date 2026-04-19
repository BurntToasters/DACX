import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:media_kit/media_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:window_manager/window_manager.dart';

import 'screens/player_screen.dart';
import 'services/settings_service.dart';

class _NoBounceScrollBehavior extends MaterialScrollBehavior {
  const _NoBounceScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const ClampingScrollPhysics();
  }
}

void main(List<String> args) async {
  WidgetsFlutterBinding.ensureInitialized();
  MediaKit.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final settings = SettingsService(prefs);

  await windowManager.ensureInitialized();

  // Restore saved window geometry or use defaults.
  final savedSize = settings.rememberWindow ? settings.windowSize : null;
  final savedPos = settings.rememberWindow ? settings.windowPosition : null;

  final windowOptions = WindowOptions(
    size: savedSize ?? const Size(960, 600),
    minimumSize: const Size(480, 320),
    center: savedPos == null,
    title: 'Dacx',
    backgroundColor: const Color(0xFF0E141B),
    titleBarStyle: Platform.isWindows || Platform.isMacOS
        ? TitleBarStyle.hidden
        : TitleBarStyle.normal,
  );

  final windowReady = Completer<void>();
  final firstFrameReady = Completer<void>();
  var windowShown = false;

  Future<void> showWindowIfReady() async {
    if (windowShown ||
        !windowReady.isCompleted ||
        !firstFrameReady.isCompleted) {
      return;
    }
    windowShown = true;
    await windowManager.show();
    await windowManager.focus();
  }

  windowManager.waitUntilReadyToShow(windowOptions, () async {
    if (savedPos != null) {
      await windowManager.setPosition(savedPos);
    }
    await windowManager.setAlwaysOnTop(settings.alwaysOnTop);
    if (!windowReady.isCompleted) {
      windowReady.complete();
    }
    await showWindowIfReady();
  });

  // Collect CLI file argument (first non-flag arg).
  final cliFile = _parseCliFilePath(args);

  runApp(DacxApp(settings: settings, initialFile: cliFile));

  WidgetsBinding.instance.addPostFrameCallback((_) async {
    if (!firstFrameReady.isCompleted) {
      firstFrameReady.complete();
    }
    await showWindowIfReady();
  });
}

/// Extracts the first CLI argument that looks like a file path.
String? _parseCliFilePath(List<String> args) {
  for (final rawArg in args) {
    if (rawArg.trim().isEmpty || rawArg.startsWith('-')) continue;
    final candidatePath = _normalizeCliPath(rawArg);
    if (candidatePath != null && File(candidatePath).existsSync()) {
      return candidatePath;
    }
  }
  return null;
}

String? _normalizeCliPath(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return null;

  if (trimmed.length >= 2 &&
      ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    return trimmed.substring(1, trimmed.length - 1);
  }

  final uri = Uri.tryParse(trimmed);
  if (uri != null && uri.scheme == 'file') {
    try {
      return uri.toFilePath(windows: Platform.isWindows);
    } catch (_) {
      return null;
    }
  }

  if (!trimmed.contains(':')) return trimmed;

  // Preserve Windows paths such as C:\music\song.mp3
  try {
    if (Platform.isWindows &&
        trimmed.length > 2 &&
        RegExp(r'^[a-zA-Z]:[\\/]').hasMatch(trimmed)) {
      return trimmed;
    }
  } catch (_) {}

  return null;
}

class DacxApp extends StatefulWidget {
  final SettingsService settings;
  final String? initialFile;

  const DacxApp({super.key, required this.settings, this.initialFile});

  @override
  State<DacxApp> createState() => _DacxAppState();
}

class _DacxAppState extends State<DacxApp> with WindowListener {
  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    widget.settings.addListener(_onSettingsChanged);
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    widget.settings.removeListener(_onSettingsChanged);
    super.dispose();
  }

  void _onSettingsChanged() => setState(() {});

  // ── WindowListener ───────────────────────────────────────

  @override
  void onWindowResized() => _saveGeometry();

  @override
  void onWindowMoved() => _saveGeometry();

  Future<void> _saveGeometry() async {
    if (!widget.settings.rememberWindow) return;
    final size = await windowManager.getSize();
    final pos = await windowManager.getPosition();
    widget.settings.saveWindowSize(size);
    widget.settings.saveWindowPosition(pos);
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.settings;
    final seed = s.accentColor.color;

    return MaterialApp(
      title: 'Dacx',
      debugShowCheckedModeBanner: false,
      scrollBehavior: const _NoBounceScrollBehavior(),
      themeMode: s.themeMode,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: seed,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: seed,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        brightness: Brightness.dark,
      ),
      home: PlayerScreen(settings: s, initialFile: widget.initialFile),
    );
  }
}
