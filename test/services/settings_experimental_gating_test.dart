import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dacx/playback/playback_mix_policy.dart';
import 'package:dacx/services/settings_service.dart';

void main() {
  group('SettingsService experimental gating', () {
    Future<SettingsService> serviceWith({
      required bool experimental,
      Map<String, Object> prefs = const {},
    }) async {
      SharedPreferences.setMockInitialValues({
        'experimental_features_enabled': experimental,
        ...prefs,
      });
      final prefsInstance = await SharedPreferences.getInstance();
      return SettingsService(prefsInstance);
    }

    test('multiAudioMix reports false when experimental is disabled', () async {
      final settings = await serviceWith(
        experimental: false,
        prefs: {'multi_audio_mix': true},
      );
      expect(settings.multiAudioMix, isFalse);
    });

    test(
      'multiAudioMix stays off while user-facing mix is withdrawn',
      () async {
        expect(PlaybackMixPolicy.userFacingEnabled, isFalse);
        final settings = await serviceWith(
          experimental: true,
          prefs: {'multi_audio_mix': true},
        );
        expect(settings.multiAudioMix, isFalse);
        settings.multiAudioMix = true;
        expect(settings.multiAudioMix, isFalse);
      },
    );

    test('disabling experimental does not surface withdrawn mix', () async {
      final settings = await serviceWith(
        experimental: true,
        prefs: {'multi_audio_mix': true},
      );
      settings.experimentalFeaturesEnabled = false;
      expect(settings.multiAudioMix, isFalse);

      settings.experimentalFeaturesEnabled = true;
      expect(settings.multiAudioMix, isFalse);
    });
  });
}
