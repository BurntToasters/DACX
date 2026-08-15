# Idea: Multi-audio mix (`lavfi-complex` amix)

Status: **withdrawn from the UI** as of `v0.11.2-beta.1`. Implementation is still in the tree (`PlaybackMixPolicy`, `PlayerScreen._applyMultiAudioMix`, stored `multi_audio_mix` pref). Users cannot enable it.

Flip `PlaybackMixPolicy.userFacingEnabled` to `true` and the Settings / ⋯ menu tiles come back (still behind Experimental Features).

---

## Why it is off

1. **Stock Windows/macOS libmpv cannot run it.** media_kit’s bundled FFmpeg uses `--disable-filters` with a tiny whitelist (`overlay`, `equalizer`). `amix` and `aformat` are missing. Installing a system `ffmpeg` does not help.
2. **Linux only “worked” with distro libmpv**, not because the Dart path was solid cross-platform.
3. **Property echo is not success.** Writing `lavfi-complex` and reading it back does not prove the graph is live.
4. **Shipping a half-working Experimental toggle** taught testers the feature exists, then failed on the two platforms most people use.

Do not show the toggle again until a linked libmpv on **Windows, macOS, and Linux** actually has `amix`/`aformat` (custom FFmpeg, or probed capability that disables the control when filters are absent).

---

## What is still in the code

| Piece | Role |
| ----- | ---- |
| `lib/playback/playback_mix_policy.dart` | lavfi graph builder + `userFacingEnabled` kill switch |
| `SettingsService.multiAudioMix` | stored pref; getter forced `false` while the switch is off |
| `PlayerScreen._applyMultiAudioMix` | apply/clear `lavfi-complex`; still runs as a no-op/clear |
| l10n `menuMixAllAudioTracks` / `settingsMultiAudioMixSubtitle` | copy for the hidden tiles |

Related: `docs/ideas/visualizer.md` (same FFmpeg whitelist problem).
