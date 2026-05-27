# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- Dart 3.6.0+ - Core application language for Flutter framework
- JavaScript - Minimal web configuration (via Flutter Web)

**Secondary:**
- Java - Android platform layer
- Kotlin - Android platform code
- Swift - iOS platform layer
- C/C++ - Native platform integrations

## Runtime

**Environment:**
- Flutter (3.x stable channel) - Cross-platform framework
- Dart Runtime - VM for development, compiled for production
- Flutter Web - Browser-based execution with JavaScript transpilation

**Package Manager:**
- Pub (Dart Package Manager) - Primary dependency management
- npm - Minimal usage (package-lock.json present, likely legacy)

Lockfiles:
- `pubspec.lock` - Dart dependencies pinned (present)
- `package-lock.json` - npm lock (minimal/legacy)

## Frameworks

**Core:**
- Flutter 3.x - Complete UI framework for web, mobile, desktop
- Material Design 3 - Design system for UI components
- Dart language runtime - Application runtime

**UI & Components:**
- Google Fonts 5.0.0 - Typography system
- Font Awesome Flutter 10.4.0 - Icon library
- Flutter Staggered Grid View 0.7.0 - Advanced grid layouts
- Flutter Linkify 6.0.0 - Automatic link detection in text
- Cached Network Image 3.2.3+ - Image caching and optimization

**Networking:**
- HTTP 1.1.0 - HTTP client for API requests
- URL Launcher 6.1.7 - External URL and link handling

**Testing:**
- Flutter Test SDK - Built-in testing framework
- Flutter Lints 5.0.0 - Lint rules and code analysis

**Build/Dev:**
- Flutter CLI - Build and development tool
- Analysis Options - Code analysis configuration

## Key Dependencies

**Critical:**
- `http: ^1.1.0` - Primary HTTP client for xAI API communication
- `url_launcher: ^6.1.7` - Enables external link handling (GitHub, LinkedIn, X/Twitter)
- `google_fonts: ^5.0.0` - Typography system for consistent font rendering
- `font_awesome_flutter: ^10.4.0` - Icon library for UI elements

**Infrastructure:**
- `flutter_staggered_grid_view: ^0.7.0` - Masonry grid layout for portfolio gallery
- `flutter_linkify: ^6.0.0` - Auto-linkification of URLs in text
- `cached_network_image: ^3.2.3` - Network image caching and loading
- `cupertino_icons: ^1.0.8` - Cupertino (iOS-style) icons

## Configuration

**Environment:**
- Dart SDK: 3.6.0 to <4.0.0 (specified in `pubspec.yaml`)
- API Key Storage: `lib/env.dart` contains xAI API key (WARNING: exposed in frontend)
- Theme Configuration: Runtime-based with system preference detection
- Assets: Configured in `pubspec.yaml` pointing to `web/icons/`, `assets/`

**Build:**
- Flutter Web: `web/index.html` - Web entry point
- Web Manifest: `web/manifest.json` - PWA configuration
- Platform-specific configs:
  - Android: `android/app/build.gradle`
  - iOS: `ios/Runner.xcodeproj`
  - Web: `web/` directory
  - Desktop: `linux/`, `macos/`, `windows/`

## Platform Requirements

**Development:**
- Flutter SDK 3.x (stable channel)
- Dart SDK 3.6.0+
- Platform SDKs: Android SDK, iOS SDK, Web support
- IDE: Android Studio, Xcode, or VS Code with Flutter extension
- Git for version control

**Production:**
- Deployment Target: Web (hosted at parzival.live)
- Platforms: Web (primary), Android, iOS, Linux, macOS, Windows
- Browser Support: Chrome (recommended), Firefox, Safari, Edge
- Hosting: Static web hosting (Flutter Web produces static files)

**Build Artifacts:**
- Output: `build/web/` - Static web files ready for deployment
- Format: JavaScript, HTML, CSS, assets

---

*Stack analysis: 2026-04-02*
