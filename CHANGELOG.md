# UHAK CHANGELOG

## v1.0.1

## Overview

v1.0.1 is a maintenance release that stabilizes gameplay flow and improves visual obstacle design.

## Highlights

- Fixed score reset flow during level transitions; resolved the issue where Level 2 could complete instantly after Level 1
- Stabilized Free Mode difficulty behavior; disabled automatic difficulty shifts based on score growth
- Prevented upper-bound overflow in cloud generation; obstacles no longer extend beyond the top of the screen
- Increased Level 1 cloud gaps to make the early game easier
- Updated cloud obstacle pixel-art design; lightning visuals were reworked to sit inside clouds and be more readable
- Refined airplane sprite design to better match a real airplane silhouette

## Technical Details

- Added the `maxGapMultiplier` parameter to `LevelConfig`, making gap caps parametrically configurable per level
- Improved upper-bound safety in collision and obstacle generation flow
- Reorganized visual sprite grids and regenerated assets

## Release Metadata

- Release version: v1.0.1
- Release branch: release/v1.0.1

## v1.0.0

## Overview

v1.0.0 is the first stable cross-platform release of UHAK. With this release, the project moved to a modern web-and-Android focused structure under a single Expo-based React Native architecture.

## Highlights

- Unified app architecture based on Expo and React Native
- Shared game logic across web and mobile
- Refreshed visual design with a pixel-art theme
- Cohesive art direction across airplane, clouds, background, and menus
- More balanced obstacle gaps and smoother gameplay pacing
- Turkish and English language support
- Local score and progress persistence
- Android runtime support and native project infrastructure

## Technical Details

- Expo 54
- React 19 and React Native 0.81
- React Native Web support
- TypeScript-based codebase
- Data persistence with AsyncStorage
- Web export and static deployment preparation

## Who This Release Is For

- Players who want a fast arcade experience in the browser
- Users who want native installation on Android devices
- Teams looking for a multi-platform development approach from a single codebase

## Release Metadata

- Release version: v1.0.0
- Release branch: release/v1.0.0
