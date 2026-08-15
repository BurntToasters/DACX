import 'package:dacx/l10n/app_localizations.dart';
import 'package:dacx/widgets/missing_playback_runtime_app.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('shows blocking copy and Quit invokes onQuit', (tester) async {
    var quit = 0;
    await tester.pumpWidget(MissingPlaybackRuntimeApp(onQuit: () => quit++));
    await tester.pumpAndSettle();

    final l10n = await AppLocalizations.delegate.load(const Locale('en'));
    expect(find.text(l10n.missingLibmpvTitle), findsOneWidget);
    expect(find.text(l10n.missingLibmpvBody), findsOneWidget);

    await tester.tap(find.text(l10n.missingLibmpvQuit));
    await tester.pump();
    expect(quit, 1);
  });
}
