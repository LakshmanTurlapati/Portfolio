# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Multi-page responsive Flutter web application with responsive design patterns (mobile-first breakpoint approach)

**Key Characteristics:**
- Responsive layout system using `LayoutBuilder` with 600px breakpoint for mobile/desktop switching
- Stateful widget hierarchy managing theme state at root level
- Page-based navigation using custom `CircularRevealPageRoute` for transitions
- API integration for AI chat functionality (xAI Grok API)
- Component-based UI with reusable visual elements (animations, effects, buttons)

## Layers

**Presentation Layer (UI/Widgets):**
- Purpose: Render user interface and handle user interactions
- Location: `lib/` (all .dart files except special cases)
- Contains: Pages, components, animations, theme configuration, navigation
- Depends on: Material Design, Google Fonts, URL Launcher, Font Awesome icons
- Used by: Entry point (`main.dart`)

**Page Layer (Page Components):**
- Purpose: Full-screen page implementations for major sections
- Location: `lib/main.dart`, `lib/portfolio.dart`, `lib/about_page.dart`, `lib/chat.dart`, `lib/mobile.dart`, `lib/mobile_portfolio.dart`, `lib/mobile_about_page.dart`, `lib/chat_mobile.dart`
- Contains: Main home page, portfolio showcase, about/experience pages, chat interface
- Depends on: Component widgets, navigation routes, theme state
- Used by: Navigation system, root widget

**Component Layer (Reusable Widgets):**
- Purpose: Reusable visual components and effects
- Location: `lib/navbar.dart`, `lib/mobile_navbar.dart`, `lib/particle_background.dart`, `lib/theme_toggle.dart`, `lib/rotating_circular_text.dart`, `lib/home_text.dart`, `lib/mobile_home_text.dart`, `lib/portfolio_button.dart`, `lib/mobile_portfolio_button.dart`, `lib/dot_matrix.dart`, `lib/mobile_dot_matrix.dart`, `lib/snow.dart`, `lib/fog.dart`, `lib/spotlight.dart`, `lib/click_here.dart`
- Contains: Navigation bars, background effects, buttons, text animations, visual effects
- Depends on: Flutter Material, animation controllers
- Used by: Page components

**Service Layer (Business Logic):**
- Purpose: API communication and external service handling
- Location: `lib/chat.dart` (contains `ChatApiService` class)
- Contains: HTTP client for xAI Grok API communication, message handling
- Depends on: http package, environment configuration (`env.dart`)
- Used by: Chat pages

**Configuration Layer:**
- Purpose: Application-wide settings and constants
- Location: `lib/env.dart` (API keys), `pubspec.yaml` (dependencies)
- Contains: API keys, asset declarations, dependency versions
- Depends on: None
- Used by: Service layer, asset loading system

**Navigation Layer:**
- Purpose: Custom page transitions and routing
- Location: `lib/circular_reveal_page_route.dart`
- Contains: Custom `CircularRevealPageRoute` with circular reveal animation
- Depends on: Flutter Material routing
- Used by: Navigation triggers in navbar and pages

## Data Flow

**Page Navigation Flow:**

1. User clicks navigation button (Portfolio, About, Chat) in `navbar.dart` or `mobile_navbar.dart`
2. Navigation handler retrieves button position using `GlobalKey`
3. `CircularRevealPageRoute` is pushed with start position from button
4. Circular reveal animation expands from button position to cover screen
5. New page widget is rendered with dark/light theme passed as constructor argument

**Theme State Flow:**

1. Theme state (`isDarkMode` boolean) managed in `_MyAppState` (root widget in `main.dart`)
2. `didChangePlatformBrightness()` detects system theme changes
3. `toggleTheme()` manually flips theme state
4. Theme preference updates HTML meta tag for Safari compatibility
5. All child widgets receive `isDarkMode` and `toggleTheme` callback via constructor

**Chat API Flow:**

1. User enters message in `ChatPage` widget (in `chat.dart` or `chat_mobile.dart`)
2. Message triggers `generateResponse()` in `ChatApiService`
3. `ChatApiService.generateResponse()` builds request with conversation history
4. HTTP POST request sent to xAI Grok API at `https://api.x.ai/v1`
5. API response streamed back (implementation uses JSON parsing for non-stream responses)
6. Message displayed in chat UI with proper formatting and link detection (`flutter_linkify`)

**Asset Loading Flow:**

1. Assets declared in `pubspec.yaml` under `flutter.assets`
2. Portfolio images stored in `assets/` directory (portfolio projects, experience images)
3. Images referenced by relative path in portfolio data structures
4. `Image.asset()` or `Image.network()` loads images as needed in portfolio grid

**State Management Flow:**

1. `_MyAppState` holds `isDarkMode` (root theme state)
2. Pages and components use local state via `StatefulWidget` for animations/interactions
3. Global click counter tracked in `MobileHome._clickCount` for analytics
4. Message history maintained in `ChatState` within chat pages

## Key Abstractions

**Page Routes:**
- Purpose: Define navigation transitions between pages
- Examples: `lib/circular_reveal_page_route.dart`
- Pattern: Custom `PageRouteBuilder` with animation-based clipper for reveal effect

**Animated Components:**
- Purpose: Encapsulate complex animation logic
- Examples: `lib/particle_background.dart`, `lib/rotating_circular_text.dart`, `lib/snow.dart`, `lib/theme_toggle.dart`
- Pattern: `StatefulWidget` with `SingleTickerProviderStateMixin` or `TickerProviderStateMixin` for animation controller management

**Responsive Layout Strategy:**
- Purpose: Handle mobile/desktop differences with single codebase
- Examples: `lib/main.dart` (uses `LayoutBuilder`), separate mobile files
- Pattern: Breakpoint-based conditional rendering - mobile layout when `maxWidth < 600`, desktop otherwise

**Portfolio Data Model:**
- Purpose: Structure portfolio project information
- Examples: `lib/portfolio.dart` (desktopProjects list), `lib/mobile_portfolio.dart` (mobileProjects list)
- Pattern: List of `Map<String, dynamic>` with keys: `name`, `image`, `links`

**Chat Message Model:**
- Purpose: Structure conversation messages
- Examples: `lib/chat.dart` (ChatMessage class)
- Pattern: Data class with sender role, content, and metadata

**API Service Pattern:**
- Purpose: Encapsulate external API communication
- Examples: `lib/chat.dart` (ChatApiService)
- Pattern: Static methods for HTTP operations, JSON serialization/deserialization, error handling with user-friendly messages

## Entry Points

**Main Application Entry:**
- Location: `lib/main.dart`
- Triggers: `main()` function runs `MyApp()`
- Responsibilities: Initialize Flutter app, setup root theme state, detect platform brightness, create responsive layout switch between mobile/desktop

**Desktop Home Page:**
- Location: `lib/main.dart` (via LayoutBuilder in `MyApp.build()`)
- Triggers: Screen width >= 600px
- Responsibilities: Render navbar, home text animation, particle background, navigation to portfolio/about/chat

**Mobile Home Page:**
- Location: `lib/mobile.dart` (instantiated as `MobileHome` in `main.dart`)
- Triggers: Screen width < 600px
- Responsibilities: Render mobile navbar, home animations, track click counts for analytics

**Portfolio Page:**
- Location: `lib/portfolio.dart` (desktop), `lib/mobile_portfolio.dart` (mobile)
- Triggers: Portfolio button click in navbar, circular reveal animation
- Responsibilities: Display grid of projects with images, project links, project metadata

**About Page:**
- Location: `lib/about_page.dart` (desktop), `lib/mobile_about_page.dart` (mobile)
- Triggers: About button click in navbar
- Responsibilities: Display bio, experience, education, scrollable section navigation

**Chat Page:**
- Location: `lib/chat.dart` (desktop), `lib/chat_mobile.dart` (mobile)
- Triggers: Chat button click in navbar or direct URL access
- Responsibilities: Render chat interface, manage conversation state, call ChatApiService for responses

## Error Handling

**Strategy:** User-friendly error messages replacing technical details

**Patterns:**
- API Health Check: `ChatApiService.checkHealth()` verifies connectivity before operations
- Error Message Replacement: Technical HTTP errors replaced with "We're experiencing technical difficulties. Please try again shortly."
- Fallback Navigation: If button position can't be determined for reveal animation, fallback to standard `MaterialPageRoute`
- URL Launch Fallback: If URL can't be launched, show `SnackBar` with error message
- Null Safety: Dart null-safety enforced throughout with `required` parameters and `?` operators

## Cross-Cutting Concerns

**Logging:**
- Strategy: `print()` statements for debugging (click counts, navigation events, API calls)
- Removal in production likely needed

**Validation:**
- URL validation before launch attempts
- Message content validation before API submission
- No explicit form validation (assumes trusted user input)

**Authentication:**
- No user authentication; portfolio is public
- API key stored in `env.dart` (exposed in web minified code - noted security concern in file comments)
- System acknowledges limitation of frontend-only key exposure

**Theme Persistence:**
- System theme detection on app load
- Runtime toggle available via `ThemeToggle` component
- Theme state does NOT persist across sessions (memory-only storage)
- Meta tags updated for Safari browser theme color

---

*Architecture analysis: 2026-04-02*
