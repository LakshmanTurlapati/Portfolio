# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
portfolio_v2/
├── lib/                          # Main application source code
├── assets/                       # Static images and media files
├── web/                          # Web platform configuration
├── android/                      # Android platform configuration
├── ios/                          # iOS platform configuration
├── build/                        # Build artifacts (generated)
├── .planning/                    # GSD planning documents
├── .git/                         # Git version control
├── pubspec.yaml                  # Dart dependencies and project config
├── analysis_options.yaml         # Dart analyzer configuration
├── .gitignore                    # Git ignore rules
├── .metadata                     # Flutter metadata
├── README.md                     # Project documentation
└── final_review_gate.py          # Review automation script
```

## Directory Purposes

**lib/ (Application Source - 9,873 lines total):**
- Purpose: All Dart source code for the Flutter application
- Contains: Pages, components, services, routes, configuration
- Key files: `main.dart`, `portfolio.dart`, `about_page.dart`, `chat.dart`, navigation and UI components

**assets/:**
- Purpose: Static media assets (images, GIFs)
- Contains: Portfolio project screenshots, experience images, animations (clickhere.gif, clickherelight.gif)
- Committed: Yes
- Generated: No

**web/:**
- Purpose: Web platform-specific files
- Contains: Platform configuration, icons (portfolio.png, portfolio_light.png)
- Committed: Yes

**android/, ios/:**
- Purpose: Platform-specific native code and configuration
- Contains: Native gradle configs, CocoaPods configs, platform entitlements
- Committed: Yes (framework only, binaries in .gitignore)

**build/:**
- Purpose: Compilation and build artifacts
- Generated: Yes
- Committed: No (in .gitignore)

**.planning/codebase/:**
- Purpose: GSD (GSD) codebase analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md (as generated)
- Committed: Yes

**.dart_tool/, .idea/:**
- Purpose: Tool and IDE generated files
- Generated: Yes
- Committed: No

## Key File Locations

**Entry Points:**
- `lib/main.dart` (451 lines): Application root, theme state management, responsive layout switching

**Configuration:**
- `pubspec.yaml`: Dependencies, asset declarations, version configuration
- `analysis_options.yaml`: Dart analyzer rules and linting
- `lib/env.dart` (28 lines): API keys and environment configuration

**Core Pages:**
- `lib/portfolio.dart` (1,106 lines): Desktop portfolio showcase with project grid
- `lib/mobile_portfolio.dart` (585 lines): Mobile portfolio version with staggered layout
- `lib/about_page.dart` (833 lines): Desktop about/experience/education page with scroll navigation
- `lib/mobile_about_page.dart` (750 lines): Mobile about page
- `lib/chat.dart` (1,664 lines): Desktop chat interface with xAI API integration
- `lib/chat_mobile.dart` (1,200 lines): Mobile chat interface

**Navigation & Routing:**
- `lib/navbar.dart` (238 lines): Desktop navigation bar component
- `lib/mobile_navbar.dart` (227 lines): Mobile navigation bar component
- `lib/mobile.dart` (132 lines): Mobile home page container
- `lib/circular_reveal_page_route.dart` (79 lines): Custom page transition animation

**Visual Components & Effects:**
- `lib/particle_background.dart` (137 lines): Animated circle background effect
- `lib/snow.dart` (310 lines): Animated snow effect
- `lib/fog.dart` (170 lines): Fog/mist effect overlay
- `lib/dot_matrix.dart` (125 lines): Animated dot matrix background
- `lib/mobile_dot_matrix.dart` (140 lines): Mobile dot matrix variant
- `lib/theme_toggle.dart` (266 lines): Theme switching component (sun/moon icons)
- `lib/rotating_circular_text.dart` (293 lines): Circular rotating text animation
- `lib/spotlight.dart` (107 lines): Spotlight beam effect

**Text & Animation Components:**
- `lib/home_text.dart` (134 lines): Desktop home page scrolling text animation (rotating roles)
- `lib/mobile_home_text.dart` (375 lines): Mobile home page text animation
- `lib/click_here.dart` (282 lines): Click prompt animation/component

**Button & UI Elements:**
- `lib/portfolio_button.dart` (130 lines): Desktop portfolio button with animation
- `lib/mobile_portfolio_button.dart` (128 lines): Mobile portfolio button variant

## Naming Conventions

**Files:**
- Pattern: `snake_case.dart` (lowercase with underscores)
- Examples: `main.dart`, `particle_background.dart`, `circular_reveal_page_route.dart`

**Directories:**
- Pattern: `lowercase` (single words or snake_case)
- Examples: `lib`, `assets`, `web`, `android`, `ios`

**Classes:**
- Pattern: `PascalCase` (follows Dart convention)
- Examples: `MyApp`, `CircularRevealPageRoute`, `AnimatedCircleBackground`, `ChatApiService`

**Widgets:**
- Pattern: `PascalCase` (both StatefulWidget and State classes)
- Examples: `PortfolioPage`, `ChatPage`, `NavBar`, `ThemeToggle`

**Private Members:**
- Pattern: Prefix with underscore (`_VariableName`, `_methodName`)
- Examples: `_MyAppState`, `_onScroll()`, `_scrollController`, `_navigateToPortfolio()`

**Animation Controllers:**
- Pattern: `_[name]Controller` and `_[name]Animation`
- Examples: `_sunController`, `_rayAnimation`, `_moonRotation`, `_moonSize`

**Constants:**
- Pattern: `camelCase` in classes or `UPPER_CASE` for true constants
- Examples: `isDarkMode`, `numberOfCircles`, `baseUrl` (static const)

## Where to Add New Code

**New Page/Screen:**
1. Create `lib/[page_name].dart` for desktop version (extends `StatefulWidget` with theme parameters)
2. Create `lib/mobile_[page_name].dart` for mobile version
3. Add route in `lib/navbar.dart` and `lib/mobile_navbar.dart` with navigation methods
4. Add `CircularRevealPageRoute` or `MaterialPageRoute` for transition
5. Pass `isDarkMode` and `toggleTheme` as constructor parameters to new page

**New Component/Widget:**
1. Create `lib/[component_name].dart` (separate file per component)
2. Export as `StatefulWidget` or `StatelessWidget` class
3. For responsive variants: create separate `lib/mobile_[component_name].dart` if different layout needed
4. Use animation controllers with `SingleTickerProviderStateMixin` or `TickerProviderStateMixin` for animations

**New Visual Effect:**
1. Create `lib/[effect_name].dart`
2. Use `CustomPainter` for complex drawing (e.g., fog, snow)
3. Use `AnimationController` with `TickerProviderStateMixin` for animations
4. Stack as overlay in page using `Stack` widget positioning

**New Service/API Integration:**
1. Add service class in `lib/chat.dart` or create new `lib/[service_name]_service.dart`
2. Use `http` package for HTTP requests
3. Store credentials in `lib/env.dart` (note: exposed in minified web code)
4. Return structured data using Dart classes or Maps
5. Include error handling with user-friendly messages

**Utilities/Helpers:**
1. Small utilities: Add to bottom of relevant existing file
2. Reusable utilities: Create `lib/utils/[utility_name].dart` (pattern not currently followed, can establish new convention)
3. Extension methods: Add to relevant file using `extension` syntax

**Assets:**
1. Images for portfolio projects: Place in `assets/` directory
2. Referenced in portfolio data structures in `portfolio.dart` and `mobile_portfolio.dart`
3. Declare in `pubspec.yaml` under `flutter.assets`
4. Load using `Image.asset('assets/[image_name]')`

## Special Directories

**assets/:**
- Purpose: Static media files
- Generated: No
- Committed: Yes
- Contents: PNG/JPG/GIF images for projects, experience, and animations

**build/:**
- Purpose: Build output and artifacts
- Generated: Yes (by `flutter build`)
- Committed: No
- Contents: Web build artifacts, Android/iOS binaries

**.dart_tool/:**
- Purpose: Flutter/Dart package manager cache and generated files
- Generated: Yes
- Committed: No

**.planning/codebase/:**
- Purpose: Architecture and planning documents (GSD-generated)
- Generated: Yes (by GSD commands)
- Committed: Yes (to preserve documentation)

## Import Organization

**Standard Pattern Observed:**
```dart
// 1. Dart imports
import 'dart:ui';
import 'dart:html' as html;
import 'dart:convert';
import 'dart:async';

// 2. Flutter/Material imports
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';

// 3. Third-party packages
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:flutter_linkify/flutter_linkify.dart';

// 4. Relative imports (local files)
import 'navbar.dart';
import 'portfolio.dart';
import 'env.dart';
```

**No Path Aliases:** Direct relative imports used throughout. No path alias configuration in pubspec.yaml.

## File Size Distribution

**Large Files (complex logic):**
- `lib/chat.dart` (1,664 lines): Chat UI + API service combined
- `lib/chat_mobile.dart` (1,200 lines): Mobile chat variant
- `lib/portfolio.dart` (1,106 lines): Portfolio grid + project data
- `lib/about_page.dart` (833 lines): About page with sections

**Medium Files (page components):**
- `lib/mobile_about_page.dart` (750 lines)
- `lib/mobile_portfolio.dart` (585 lines)
- `lib/main.dart` (451 lines): Root widget + responsive routing

**Small Files (focused components):**
- `lib/circular_reveal_page_route.dart` (79 lines): Single purpose animation
- `lib/env.dart` (28 lines): Config only
- `lib/spotlight.dart` (107 lines): Single effect

---

*Structure analysis: 2026-04-02*
