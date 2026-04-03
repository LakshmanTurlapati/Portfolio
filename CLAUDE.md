<!-- GSD:project-start source:PROJECT.md -->
## Project

**Portfolio V2 -- Next.js Migration**

A 1:1 migration of an existing Flutter web portfolio site (audienclature.com) to Next.js with Tailwind CSS. The portfolio showcases projects, experience, education, and includes an AI chat feature powered by xAI Grok API. Every page, animation, and visual effect from the Flutter version must be faithfully reproduced in the Next.js version.

**Core Value:** Pixel-perfect replication of the existing Flutter portfolio in Next.js -- same look, same feel, same features, nothing lost in translation.

### Constraints

- **Tech stack**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Visual fidelity**: Must match Flutter version pixel-for-pixel on all pages
- **Animations**: All custom animations (particle background, snow, fog, circular reveal, rotating text, dot matrix, spotlight) must be replicated
- **API security**: xAI Grok API key must be server-side only (Next.js API route)
- **Deployment**: AWS Amplify
- **Responsive**: Same 600px mobile/desktop breakpoint behavior
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Dart 3.6.0+ - Core application language for Flutter framework
- JavaScript - Minimal web configuration (via Flutter Web)
- Java - Android platform layer
- Kotlin - Android platform code
- Swift - iOS platform layer
- C/C++ - Native platform integrations
## Runtime
- Flutter (3.x stable channel) - Cross-platform framework
- Dart Runtime - VM for development, compiled for production
- Flutter Web - Browser-based execution with JavaScript transpilation
- Pub (Dart Package Manager) - Primary dependency management
- npm - Minimal usage (package-lock.json present, likely legacy)
- `pubspec.lock` - Dart dependencies pinned (present)
- `package-lock.json` - npm lock (minimal/legacy)
## Frameworks
- Flutter 3.x - Complete UI framework for web, mobile, desktop
- Material Design 3 - Design system for UI components
- Dart language runtime - Application runtime
- Google Fonts 5.0.0 - Typography system
- Font Awesome Flutter 10.4.0 - Icon library
- Flutter Staggered Grid View 0.7.0 - Advanced grid layouts
- Flutter Linkify 6.0.0 - Automatic link detection in text
- Cached Network Image 3.2.3+ - Image caching and optimization
- HTTP 1.1.0 - HTTP client for API requests
- URL Launcher 6.1.7 - External URL and link handling
- Flutter Test SDK - Built-in testing framework
- Flutter Lints 5.0.0 - Lint rules and code analysis
- Flutter CLI - Build and development tool
- Analysis Options - Code analysis configuration
## Key Dependencies
- `http: ^1.1.0` - Primary HTTP client for xAI API communication
- `url_launcher: ^6.1.7` - Enables external link handling (GitHub, LinkedIn, X/Twitter)
- `google_fonts: ^5.0.0` - Typography system for consistent font rendering
- `font_awesome_flutter: ^10.4.0` - Icon library for UI elements
- `flutter_staggered_grid_view: ^0.7.0` - Masonry grid layout for portfolio gallery
- `flutter_linkify: ^6.0.0` - Auto-linkification of URLs in text
- `cached_network_image: ^3.2.3` - Network image caching and loading
- `cupertino_icons: ^1.0.8` - Cupertino (iOS-style) icons
## Configuration
- Dart SDK: 3.6.0 to <4.0.0 (specified in `pubspec.yaml`)
- API Key Storage: `lib/env.dart` contains xAI API key (WARNING: exposed in frontend)
- Theme Configuration: Runtime-based with system preference detection
- Assets: Configured in `pubspec.yaml` pointing to `web/icons/`, `assets/`
- Flutter Web: `web/index.html` - Web entry point
- Web Manifest: `web/manifest.json` - PWA configuration
- Platform-specific configs:
## Platform Requirements
- Flutter SDK 3.x (stable channel)
- Dart SDK 3.6.0+
- Platform SDKs: Android SDK, iOS SDK, Web support
- IDE: Android Studio, Xcode, or VS Code with Flutter extension
- Git for version control
- Deployment Target: Web (hosted at audienclature.com)
- Platforms: Web (primary), Android, iOS, Linux, macOS, Windows
- Browser Support: Chrome (recommended), Firefox, Safari, Edge
- Hosting: Static web hosting (Flutter Web produces static files)
- Output: `build/web/` - Static web files ready for deployment
- Format: JavaScript, HTML, CSS, assets
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- `snake_case` for file names: `main.dart`, `home_text.dart`, `portfolio_button.dart`, `mobile_portfolio.dart`
- Platform-specific prefixes for mobile/desktop variants: `mobile_*.dart`, `*_button.dart`
- Clear descriptive names matching their primary widget/component
- `PascalCase` for all class names: `ScrollingText`, `AnimatedGradientButton`, `HomePage`, `NavBar`, `SpotlightEffect`
- `_ClassName` pattern for private state classes: `_MyAppState`, `_HomePageState`, `_ScrollingTextState`, `_ThemeToggleState`
- Descriptive names indicating purpose: `MobilePortfolioPage`, `CircularRevealPageRoute`, `ChatApiService`
- `camelCase` for function and method names: `incrementClickCounter()`, `toggleTheme()`, `_navigateToPortfolio()`, `_updatePortfolioButtonPosition()`
- Leading underscore `_` for private methods: `_toggleChat()`, `_navigateToAbout()`, `_updatePainter()`
- Verb-prefixed names for actions: `incrementClickCounter`, `toggleTheme`, `launchURL`, `mobile_launchLink`
- Double underscore prefix occasionally used with scope prefix: `mobile_onScroll()`, `mobile_updateActiveProject()`
- `camelCase` for instance and local variables: `isDarkMode`, `isHovered`, `isChatOpen`, `clickCounter`, `scrollController`
- Leading underscore for private fields: `_controller`, `_timer`, `_currentIndex`, `_dragProgress`
- `late` keyword for late-initialized variables: `late FixedExtentScrollController _scrollController`, `late AnimationController _controller`
- `final` for immutable variables and parameters: `final bool isDarkMode`, `final VoidCallback toggleTheme`
- `const` for compile-time constants: `const Duration(milliseconds: 300)`, `const Color(0xFF000000)`
- PascalCase for type names and widgets: `Offset`, `Size`, `Duration`, `AnimationController`, `MaterialApp`
- Generics with clear type parameters: `List<String>`, `Map<String, String>`, `Map<String, dynamic>`
## Code Style
- Dart built-in formatting (flutter format)
- Spacing around operators and after keywords
- Consistent indentation with 2 spaces
- Line breaks before widget tree properties
- Comments above inline HTML-like widget structures
- Flutter Lints (`flutter_lints: ^5.0.0`) enabled via `package:flutter_lints/flutter.yaml`
- Standard analyzer configuration in `analysis_options.yaml`
- Project uses `useMaterial3: true` for Material 3 compliance
## Import Organization
- No aliases detected; uses relative imports within lib directory
- Direct file imports preferred: `import 'navbar.dart'`, `import 'portfolio_button.dart'`
## Error Handling
- Try-catch blocks for error-prone operations (API calls, URL launches):
- String-based throw statements: `throw 'Could not launch $url'`
- User-facing error messages returned: fallback error strings returned instead of throwing
- Graceful degradation for failed operations (e.g., navigation fallback to MaterialPageRoute)
- `chat_mobile.dart`: Try-catch for API requests with fallback error messages
- `mobile_navbar.dart`: Try-catch for URL launching with string-based throws
- `navbar.dart`: Fallback MaterialPageRoute when position detection fails
## Logging
- Debug print statements for development: `print('Portfolio clicked')`, `print('Drag started on arrow')`
- Information logging on state changes: `print('Mobile Home - Click count incremented to: $_clickCount')`
- Drag/interaction debugging: `print('Drag ended with velocity: ${details.velocity.pixelsPerSecond.dx}')`
- Context debugging with variable interpolation: `print('Mobile Home Text - clickCount: ${widget.clickCount}, showAnimations: $_showAnimations')`
- `main.dart`: User interaction logging
- `navbar.dart`: Navigation events
- `mobile_home_text.dart`: Drag and animation state
- `mobile.dart`: State changes
## Comments
- Code sections within methods marked with inline comments: `// Background gradient with smooth transition`
- Logic explanations for non-obvious calculations: `// Portfolio button is at the left side of the navbar`
- Widget positioning/layout comments explaining relative positions
- Lifecycle and state change explanations
- Line comments preferred: `// Comment`
- Comments placed above the code they describe
- Clear, descriptive language without unnecessary verbosity
- `// Remove global counter` (intentional removal note)
- `// Detect system theme preference`
- `// Add observer for system theme changes`
- `// Only show ChatPlaceholder when chat is not open`
## Function Design
- Functions average 5-40 lines
- Widget build methods are larger (50-300 lines for complex layouts)
- State management methods kept concise (5-15 lines)
- Named parameters preferred for optional values
- `required` keyword for mandatory parameters: `required this.isDarkMode`, `required this.toggleTheme`
- Default values used: `this.isDarkMode = false`
- Callback functions as parameters: `final VoidCallback toggleTheme`, `final Function(int) incrementClickCounter`
- Widget-returning functions in StatefulWidgets: `State<MyClass> createState()`
- Void for state mutations: `void toggleTheme()`, `void _updatePortfolioButtonPosition()`
- Futures for async operations: `Future<void> mobile_launchURL(String url)`
- Getters not used; direct property access preferred
## Module Design
- No barrel files detected; single widget per file preferred
- Related helper classes in same file: `SunCirclePainter`, `DashedLine`, `DashedLinePainter` in `theme_toggle.dart`
- One main widget class per file (StatefulWidget or StatelessWidget)
- Helper classes and painters in same file as primary widget
- State classes follow widget class: `Widget` -> `_WidgetState`
- Nested helper classes when they're only used by parent widget
- Parent widgets pass state management via callbacks
- Child widgets accept configuration via constructor parameters
- Platform-specific variants handled as separate files (`mobile_*` and desktop versions)
- Clear separation between widget UI files and logic files
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Responsive layout system using `LayoutBuilder` with 600px breakpoint for mobile/desktop switching
- Stateful widget hierarchy managing theme state at root level
- Page-based navigation using custom `CircularRevealPageRoute` for transitions
- API integration for AI chat functionality (xAI Grok API)
- Component-based UI with reusable visual elements (animations, effects, buttons)
## Layers
- Purpose: Render user interface and handle user interactions
- Location: `lib/` (all .dart files except special cases)
- Contains: Pages, components, animations, theme configuration, navigation
- Depends on: Material Design, Google Fonts, URL Launcher, Font Awesome icons
- Used by: Entry point (`main.dart`)
- Purpose: Full-screen page implementations for major sections
- Location: `lib/main.dart`, `lib/portfolio.dart`, `lib/about_page.dart`, `lib/chat.dart`, `lib/mobile.dart`, `lib/mobile_portfolio.dart`, `lib/mobile_about_page.dart`, `lib/chat_mobile.dart`
- Contains: Main home page, portfolio showcase, about/experience pages, chat interface
- Depends on: Component widgets, navigation routes, theme state
- Used by: Navigation system, root widget
- Purpose: Reusable visual components and effects
- Location: `lib/navbar.dart`, `lib/mobile_navbar.dart`, `lib/particle_background.dart`, `lib/theme_toggle.dart`, `lib/rotating_circular_text.dart`, `lib/home_text.dart`, `lib/mobile_home_text.dart`, `lib/portfolio_button.dart`, `lib/mobile_portfolio_button.dart`, `lib/dot_matrix.dart`, `lib/mobile_dot_matrix.dart`, `lib/snow.dart`, `lib/fog.dart`, `lib/spotlight.dart`, `lib/click_here.dart`
- Contains: Navigation bars, background effects, buttons, text animations, visual effects
- Depends on: Flutter Material, animation controllers
- Used by: Page components
- Purpose: API communication and external service handling
- Location: `lib/chat.dart` (contains `ChatApiService` class)
- Contains: HTTP client for xAI Grok API communication, message handling
- Depends on: http package, environment configuration (`env.dart`)
- Used by: Chat pages
- Purpose: Application-wide settings and constants
- Location: `lib/env.dart` (API keys), `pubspec.yaml` (dependencies)
- Contains: API keys, asset declarations, dependency versions
- Depends on: None
- Used by: Service layer, asset loading system
- Purpose: Custom page transitions and routing
- Location: `lib/circular_reveal_page_route.dart`
- Contains: Custom `CircularRevealPageRoute` with circular reveal animation
- Depends on: Flutter Material routing
- Used by: Navigation triggers in navbar and pages
## Data Flow
## Key Abstractions
- Purpose: Define navigation transitions between pages
- Examples: `lib/circular_reveal_page_route.dart`
- Pattern: Custom `PageRouteBuilder` with animation-based clipper for reveal effect
- Purpose: Encapsulate complex animation logic
- Examples: `lib/particle_background.dart`, `lib/rotating_circular_text.dart`, `lib/snow.dart`, `lib/theme_toggle.dart`
- Pattern: `StatefulWidget` with `SingleTickerProviderStateMixin` or `TickerProviderStateMixin` for animation controller management
- Purpose: Handle mobile/desktop differences with single codebase
- Examples: `lib/main.dart` (uses `LayoutBuilder`), separate mobile files
- Pattern: Breakpoint-based conditional rendering - mobile layout when `maxWidth < 600`, desktop otherwise
- Purpose: Structure portfolio project information
- Examples: `lib/portfolio.dart` (desktopProjects list), `lib/mobile_portfolio.dart` (mobileProjects list)
- Pattern: List of `Map<String, dynamic>` with keys: `name`, `image`, `links`
- Purpose: Structure conversation messages
- Examples: `lib/chat.dart` (ChatMessage class)
- Pattern: Data class with sender role, content, and metadata
- Purpose: Encapsulate external API communication
- Examples: `lib/chat.dart` (ChatApiService)
- Pattern: Static methods for HTTP operations, JSON serialization/deserialization, error handling with user-friendly messages
## Entry Points
- Location: `lib/main.dart`
- Triggers: `main()` function runs `MyApp()`
- Responsibilities: Initialize Flutter app, setup root theme state, detect platform brightness, create responsive layout switch between mobile/desktop
- Location: `lib/main.dart` (via LayoutBuilder in `MyApp.build()`)
- Triggers: Screen width >= 600px
- Responsibilities: Render navbar, home text animation, particle background, navigation to portfolio/about/chat
- Location: `lib/mobile.dart` (instantiated as `MobileHome` in `main.dart`)
- Triggers: Screen width < 600px
- Responsibilities: Render mobile navbar, home animations, track click counts for analytics
- Location: `lib/portfolio.dart` (desktop), `lib/mobile_portfolio.dart` (mobile)
- Triggers: Portfolio button click in navbar, circular reveal animation
- Responsibilities: Display grid of projects with images, project links, project metadata
- Location: `lib/about_page.dart` (desktop), `lib/mobile_about_page.dart` (mobile)
- Triggers: About button click in navbar
- Responsibilities: Display bio, experience, education, scrollable section navigation
- Location: `lib/chat.dart` (desktop), `lib/chat_mobile.dart` (mobile)
- Triggers: Chat button click in navbar or direct URL access
- Responsibilities: Render chat interface, manage conversation state, call ChatApiService for responses
## Error Handling
- API Health Check: `ChatApiService.checkHealth()` verifies connectivity before operations
- Error Message Replacement: Technical HTTP errors replaced with "We're experiencing technical difficulties. Please try again shortly."
- Fallback Navigation: If button position can't be determined for reveal animation, fallback to standard `MaterialPageRoute`
- URL Launch Fallback: If URL can't be launched, show `SnackBar` with error message
- Null Safety: Dart null-safety enforced throughout with `required` parameters and `?` operators
## Cross-Cutting Concerns
- Strategy: `print()` statements for debugging (click counts, navigation events, API calls)
- Removal in production likely needed
- URL validation before launch attempts
- Message content validation before API submission
- No explicit form validation (assumes trusted user input)
- No user authentication; portfolio is public
- API key stored in `env.dart` (exposed in web minified code - noted security concern in file comments)
- System acknowledges limitation of frontend-only key exposure
- System theme detection on app load
- Runtime toggle available via `ThemeToggle` component
- Theme state does NOT persist across sessions (memory-only storage)
- Meta tags updated for Safari browser theme color
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
