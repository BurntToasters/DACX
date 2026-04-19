# Dacx

Quick, lightweight cross-platform media player.

Built with Flutter + [media_kit](https://github.com/media-kit/media-kit) (libmpv).

## Platforms

- Windows
- macOS
- Linux

## Development

> [!NOTE]
> This project uses Flutter/Dart but also NodeJS. Its a little bit messy and not the best of practices I know, im just the most familiar and confident with js scripting and node so thats how the project is controlled. Sorry :P

```bash
# Install Node.js dependencies (build scripts)
npm install

# Install Flutter dependencies
flutter pub get

# Run in development mode
npm run dev

# Run tests
npm run test:all

# Build for current platform
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## License

[GPLv3](LICENSE)
