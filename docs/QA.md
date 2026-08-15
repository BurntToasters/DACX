# Manual QA checklist (pre-stable)

Run on **Windows (MSI or debug)**, **macOS 15+**, and **Linux**: prefer **AppImage** (ideally via [AppManager](https://github.com/kem-a/AppManager)) plus optionally one deb/rpm. Use a short local audio file, a video file, and an `.m3u` / `.pls` with 2+ entries.

Tick items as you go before a stable cut. Fix failures as they surface rather than stacking features.

## Playback

- [ ] Open File / Open Folder / Open Playlist from UI (and macOS File menu where applicable)
- [ ] Empty state: ⋯ more menu **Open URL** works **without** media; `Ctrl/Cmd+U` opens URL dialog
- [ ] Drag-and-drop a supported file onto the empty state
- [ ] Play / pause / stop / seek / mute / volume
- [ ] Cycle playback speed from transport chip and `[` / `]` / `\`; OS Now Playing / SMTC / MPRIS reflects rate
- [ ] Loop modes; queue prev/next wraps or stops as expected (tooltips: Shift+P / Shift+N)
- [ ] Reopen Last restores the previous file (Ctrl/Cmd+R)
- [ ] With **Resume from last position** on: seek into a file, quit or stop, reopen the same file (or Reopen Last) and land near the saved position
- [ ] With resume on: seek near the end, reopen; resume should clear / start near the beginning (no stuck near-end seek)
- [ ] Load external audio / subtitle from the more menu when media is open
- [ ] Sleep timer (⋯ menu): set 15/30/45/60 → playback stops when it fires; Off cancels

## Queue / playlists

- [ ] Multiple files enqueue; drag-reorder works (handle visible; screen reader mentions reorder)
- [ ] Shuffle toggle on drawer **and** more menu (OS shuffle stays in sync); quit/relaunch keeps preference
- [ ] Clear queue
- [ ] Save Playlist exports `.m3u`; re-open that playlist and a `.pls`
- [ ] Quit and relaunch shows empty home (no auto-loaded queue/media)

## OS chrome

- [ ] Media session / Now Playing / SMTC / MPRIS shows title + artwork and responds to play/pause
- [ ] Media-session artwork: play a file with embedded cover art; OS chrome shows art (not blank/stale from a prior track)
- [ ] Display does not sleep while video plays (idle inhibit); leave playing ≥1-2 min
- [ ] Windows: Jump List recents + taskbar progress while playing
- [ ] macOS: File menu + Dock menu New Window / Open; Open Recent → Clear Menu
- [ ] Linux AppImage: Check for Updates mentions AppManager and/or replacing the AppImage; deb/rpm shows package guidance (not “portable”)
- [ ] Linux AppImage/tar/Flatpak play a local file **without** installing distro libmpv. deb/rpm still need the distro package.
- [ ] Windows: second launch with no file restores the existing window (does not spawn a second instance). Open With / file argument while tray-hidden also restores and focuses.
- [ ] macOS: Dock click restores a tray-hidden window
- [ ] Fullscreen: chrome + cursor auto-hide; mouse/key reveals; click pauses; scroll changes volume
- [ ] Clear queue asks for confirmation; confirming stops playback if something is playing
- [ ] Linux MPRIS: lock-screen scrubber does not jitter from Seeked spam while playing
- [ ] Minimize to tray (Appearance, off by default): close hides; tray icon is visible on Windows and macOS; tray Show restores; tray Quit exits

## Settings / updates

- [ ] Escape from Settings returns to the player (same as back)
- [ ] Escape closes the play queue drawer; a second Escape exits fullscreen when active (including OS/title-bar fullscreen)
- [ ] Keybind capture: Escape cancels without saving a binding
- [ ] Opening an unrecognized extension warns with a snackbar (playback may still be attempted)
- [ ] Failed external audio/subtitle load shows a snackbar
- [ ] Flatpak (if tested): dropping inaccessible files mentions sandbox / inaccessible paths
- [ ] Appearance: theme, accent; Win/mac blur + opacity without Experimental master switch
- [ ] Turning **Experimental off** on Win/mac does **not** clear Appearance blur / opacity
- [ ] Hardware decode change applies without requiring app restart (copy matches behavior)
- [ ] Settings → Keyboard shortcuts opens the full editable F1 keybinds dialog
- [ ] Experimental section: Linux compositor blur appears when master is on (WIP lane; expected unstable). Multi-audio mix must **not** appear.
- [ ] Seek thumbnails toggle lives under Playback settings (not the more menu)
- [ ] Check for Updates opens a sensible path (self-update on Win MSI / macOS Applications; Linux package guidance)
- [ ] Windows MSI self-update burn-in: `dacx-update-helper.exe` next to `dacx.exe`; after Apply, no `.ps1` under `%LOCALAPPDATA%\Dacx\updates`; `helper.log` shows wait → sha256 → msiexec → `relaunched …\dacx.exe`; app returns like macOS update & restart
- [ ] Windows recovery boundary: `v0.11.0` / `v0.11.1-beta.1` requires one manual `v0.11.1` MSI install; test a later in-app update from `v0.11.1`
- [ ] Force a self-update failure: dialog retains the diagnostic error and **Download the update manually** opens the Rosie update page for stable builds or the exact GitHub prerelease page for beta builds
- [ ] Flatpak (if tested): empty-state copy mentions picker; update guidance mentions reinstalling the `.flatpak` (not Flathub / `flatpak update`)

## Trust smoke

- [ ] Unsupported / unsafe paths (e.g. credential URLs) are refused with feedback
- [ ] Screenshot save works when media is playing
- [ ] Media Info shows title / artist / album when tags are present
- [ ] macOS: updated app remains Developer ID signed / Gatekeeper-happy after self-update
- [ ] Windows release build: MSI passes Ed25519 manifest, SHA-256, and configured Artifact Signing publisher checks
