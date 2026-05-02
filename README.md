<p align="center">
	<img src="./assets/icon.png" alt="UHAK icon" width="120" />
</p>

<h1 align="center">UHAK: Beyond the Clouds</h1>

<p align="center">
	<a href="https://github.com/hckorkmaz/uhak/releases/latest">
		<img src="https://img.shields.io/github/v/release/hckorkmaz/uhak?style=flat&label=release&color=2ea44f&labelColor=24292f" alt="Latest release" />
	</a>
	<a href="https://github.com/hckorkmaz/uhak/releases">
		<img src="https://img.shields.io/github/downloads/hckorkmaz/uhak/total?style=flat&label=downloads&color=2188ff&labelColor=24292f" alt="Downloads" />
	</a>
	<a href="https://github.com/hckorkmaz/uhak/commits/main">
		<img src="https://img.shields.io/github/last-commit/hckorkmaz/uhak?style=flat&label=last%20update&color=6f42c1&labelColor=24292f" alt="Last update" />
	</a>
</p>

<p align="center">
	<img src="https://img.shields.io/badge/platform-web%20%7C%20android%20%7C%20ios-2188ff?style=flat&labelColor=24292f" alt="Platforms" />
	<img src="https://img.shields.io/badge/built%20with-Expo%2055-444444?style=flat&labelColor=24292f&logo=expo&logoColor=white" alt="Built with Expo 55" />
</p>

UHAK is a pixel-art arcade flight game focused on reflexes and timing. The project runs as a single Expo-based React Native app across web, Android, and iOS.

## Game Overview

You control a small airplane, navigate through cloud obstacles, avoid collisions, and chase your highest score. The game combines classic arcade pacing with short, mobile-friendly sessions.

### Core Gameplay Features

- Level-based progression
- Free mode with endless score flow
- Difficulty scaling and obstacle balancing
- Cloud obstacles, safe passage gaps, and collision checks
- Game over, level complete, and win states
- Turkish and English language support
- Persistent best score and progression data

### Visual Direction

- Cohesive pixel-art visual style
- Retro typography and menu styling
- Fast and simple touch-friendly UI
- Shared art direction across airplane, clouds, background, and screens

## Architecture

The app is built with a single cross-platform codebase.

- Expo provides runtime tooling and platform integration
- React Native powers app screens and game UI
- React Native Web delivers the same core experience in browsers
- Platform-agnostic game logic is isolated under `src/game`
- Visual/sprite components are organized under `src/components`
- Local persistence is handled with AsyncStorage

## Tech Stack

### Core

- Expo 55
- React 19.2
- React Native 0.83.6
- React Native Web
- TypeScript

### Runtime and Integration

- `expo-font`
- `expo-status-bar`
- `react-native-safe-area-context`
- `@react-native-async-storage/async-storage`

### Asset and Build Tooling

- `@expo-google-fonts/vt323`
- `@napi-rs/canvas`
- Expo web export for static deployment

## Supported Platforms

- Web browsers
- Android
- iOS

## Getting Started

Requirement: Node.js 20+ is recommended (Node.js 18+ minimum).

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm run dev
```

3. Run on Android

```bash
npm run android
```

4. Run on iOS

```bash
npm run ios
```

5. Run on web

```bash
npm run web
```

6. Run type checks

```bash
npm run typecheck
```

7. Build static web output

```bash
npm run build
```

## Available Scripts

- `npm run dev`: start Expo with cleared cache
- `npm run start`: start Expo
- `npm run android`: build/run Android app
- `npm run ios`: build/run iOS app
- `npm run web`: run web target locally
- `npm run typecheck`: TypeScript validation
- `npm run build` / `npm run build:web`: export static web bundle to `dist/`

## Project Structure

- `App.tsx`: main game flow and screen routing
- `src/game`: core game engine, constants, types, storage
- `src/components`: sprites and visual UI components
- `assets`: images and static visual resources
- `android`: native Android project
- `tools`: helper scripts for asset generation and web build path fixes
- `app.json`: Expo app config
- `.github/workflows/deploy.yml`: GitHub Pages deployment pipeline

## Changelog and Release Notes

- Changelog: `CHANGELOG.md`
- GitHub Releases: repository Releases page
