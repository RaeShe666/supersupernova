# Demo Studio

Demo Studio is the desktop recorder/editor imported from OpenScreen and kept under:

```txt
desktop/demo-studio
```

It is a Brand Kit Extractor sub-function, but it currently runs independently from the web app. Brand Kit data integration is intentionally not wired yet.

## Current Scope

- Desktop/window/screen recording
- Cursor and click capture
- Smart/manual zoom editing
- Custom backgrounds and wallpapers
- Timeline editor
- MP4/GIF export

## Windows Setup

OpenScreen's Windows native recorder requires the Windows WGC helper:

```txt
desktop/demo-studio/electron/native/bin/win32-x64/wgc-capture.exe
```

That file is generated locally and intentionally not committed. To rebuild it:

```bash
cd desktop/demo-studio
npm run build:native:win
```

Required system tools:

- Visual Studio Build Tools 2022 with C++ tools
- CMake component from Visual Studio Build Tools

## Development

```bash
cd desktop/demo-studio
npm install
npm run build:native:win
npm run dev
```

The source requires Node 22/npm 10 according to its package metadata. It has also been tested locally on Node 24 after repairing the Electron binary install.

## Notes

- `node_modules`, `dist-electron`, native build folders, and generated native binaries are ignored.
- Keep the upstream MIT license attribution in `desktop/demo-studio/LICENSE`.
- Do not wire Supabase or Brand Kit project data until the desktop recording/editor workflow is productized.
