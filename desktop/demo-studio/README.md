# Demo Studio

Demo Studio is the desktop recording and video editing module for SYL.AILABS Brand Kit Extractor.

It is based on OpenScreen and currently runs as an independent Electron app under `desktop/demo-studio`. Brand Kit data sync is intentionally not connected yet.

## Core Scope

- Record a screen, window, or region.
- Capture cursor movement and clicks.
- Use smart/manual zooms.
- Customize backgrounds with colors, gradients, wallpapers, or custom images.
- Edit recordings on a timeline with trim, crop, speed, blur, text, arrow, and image annotations.
- Export MP4 or GIF.

## Development

Install dependencies:

```bash
npm install
```

Build the Windows native recorder helper:

```bash
npm run build:native:win
```

Start the desktop app:

```bash
npm run dev
```

## Windows Native Helper

The Windows screen recorder depends on a generated helper:

```txt
electron/native/bin/win32-x64/wgc-capture.exe
```

This file is not committed. Rebuild it locally with:

```bash
npm run build:native:win
```

Required tools:

- Visual Studio Build Tools 2022 with C++ tools
- Visual Studio CMake component

## Attribution

Demo Studio includes code derived from OpenScreen by Siddharth Vaddem, licensed under MIT. Keep the upstream license notice in `LICENSE`.
