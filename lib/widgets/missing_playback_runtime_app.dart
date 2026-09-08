import 'package:flutter/material.dart';

import '../l10n/app_localizations.dart';

/// Blocking shell when libmpv cannot be loaded (Linux AppImage/Flatpak/tar).
class MissingPlaybackRuntimeApp extends StatelessWidget {
  const MissingPlaybackRuntimeApp({super.key, this.onQuit});

  /// Called from Quit. Production passes `() => exit(0)`.
  final VoidCallback? onQuit;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: _MissingPlaybackRuntimePage(onQuit: onQuit),
    );
  }
}

class _MissingPlaybackRuntimePage extends StatelessWidget {
  const _MissingPlaybackRuntimePage({this.onQuit});

  final VoidCallback? onQuit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 48,
                    color: theme.colorScheme.error,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.missingLibmpvTitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  Text(l10n.missingLibmpvBody, textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: onQuit,
                    child: Text(l10n.missingLibmpvQuit),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
