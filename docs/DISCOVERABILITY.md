# Discoverability and SEO

Checklist for improving how Dacx is found on GitHub and the wider web.

## GitHub (repo-side)

| Item | Status | Notes |
|------|--------|-------|
| About description | Done | Keyword-rich desktop player pitch |
| Homepage URL | Done | https://rosie.run/dacx |
| Topics (20/20) | Done | Includes `equalizer`, `playlist`, platforms, Flutter/libmpv |
| README intro | Done | Site link + natural search phrases |
| Social preview image | Asset ready | Upload manually (see below) |
| Code of Conduct | Done | [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) |
| Issue templates | Done | [.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/) |
| Discussions | Enabled | Q&A and ideas at `/discussions` |

### Social preview (manual upload required)

GitHub has no public API to set the social preview image. After changing the asset:

```bash
npm run seo:social-preview   # regenerates assets/branding/social-preview.png
```

1. Open **Settings → General → Social preview → Edit**
2. Upload [`.github/social-preview.png`](../.github/social-preview.png) (1280×640 PNG)
3. Direct link: https://github.com/BurntToasters/Dacx/settings

Recommended size: **1280×640** PNG under 1 MB.

## Marketing site (rosie.run/dacx)

The homepage lives outside this repo. Use this checklist when editing the site:

- **Title:** `Dacx — Cross-platform music and video player` (brand + category)
- **Meta description:** ~150 chars, e.g. *Fast open-source desktop media player for Windows, macOS, and Linux. Flutter + libmpv, playlists, equalizer, and broad format support.*
- **H1:** Include “Dacx” once; supporting line can mention desktop / music / video
- **Open Graph / Twitter cards:** Same title, description, and a screenshot or `.github/social-preview.png`
- **Canonical URL:** `https://rosie.run/dacx`
- **Download CTA:** Link to GitHub Releases latest
- **Crawler access:** Ensure Cloudflare (or other WAF) does not block search-engine bots on the public landing page

Suggested `<head>` snippet:

```html
<title>Dacx — Cross-platform music and video player</title>
<meta name="description" content="Fast open-source desktop media player for Windows, macOS, and Linux. Flutter + libmpv, playlists, equalizer, and broad format support." />
<meta property="og:title" content="Dacx — Cross-platform music and video player" />
<meta property="og:description" content="Fast open-source desktop media player for Windows, macOS, and Linux." />
<meta property="og:url" content="https://rosie.run/dacx" />
<meta property="og:image" content="https://rosie.run/dacx/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```

## Directory and awesome-list submissions

Use this one-liner when listing Dacx:

> **Dacx** — Fast cross-platform desktop music and video player for Windows, macOS, and Linux. Flutter + libmpv, playlists, 10-band equalizer, media-session controls. https://github.com/BurntToasters/Dacx

### Suggested lists

| List | Action |
|------|--------|
| [fluttergems/awesome-open-source-flutter-apps](https://github.com/fluttergems/awesome-open-source-flutter-apps) | PR opened: [fluttergems/awesome-open-source-flutter-apps#778](https://github.com/fluttergems/awesome-open-source-flutter-apps/pull/778) |
| [leanflutter/flutter_apps](https://github.com/leanflutter/flutter_apps) | Desktop Flutter app collection — open an issue or PR per their contribution guide |
| AlternativeTo / similar catalogs | Submit as open-source VLC/lightweight player alternative with platform tags |

### PR template (awesome-open-source-flutter-apps)

```markdown
## Summary
Adds Dacx to the Music section.

## Entry
| Dacx | [Link](https://github.com/BurntToasters/Dacx) | Fast cross-platform desktop music and video player for Windows, macOS, and Linux (Flutter + libmpv) |

## Checklist
- [x] Open-source Flutter app with active releases
- [x] Placed alphabetically in Music section
```

## Ongoing habits

- Keep release notes descriptive (CHANGELOG → GitHub Releases)
- Cross-link stable release posts on rosie.run when shipping
- Use consistent naming: **Dacx** + **media player** in titles across GitHub, site, and directories
- Answer Discussions and tag resolved Q&A for long-tail search on GitHub
