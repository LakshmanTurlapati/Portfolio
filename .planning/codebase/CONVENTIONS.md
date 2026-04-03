# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- `snake_case` for file names: `main.dart`, `home_text.dart`, `portfolio_button.dart`, `mobile_portfolio.dart`
- Platform-specific prefixes for mobile/desktop variants: `mobile_*.dart`, `*_button.dart`
- Clear descriptive names matching their primary widget/component

**Classes:**
- `PascalCase` for all class names: `ScrollingText`, `AnimatedGradientButton`, `HomePage`, `NavBar`, `SpotlightEffect`
- `_ClassName` pattern for private state classes: `_MyAppState`, `_HomePageState`, `_ScrollingTextState`, `_ThemeToggleState`
- Descriptive names indicating purpose: `MobilePortfolioPage`, `CircularRevealPageRoute`, `ChatApiService`

**Functions/Methods:**
- `camelCase` for function and method names: `incrementClickCounter()`, `toggleTheme()`, `_navigateToPortfolio()`, `_updatePortfolioButtonPosition()`
- Leading underscore `_` for private methods: `_toggleChat()`, `_navigateToAbout()`, `_updatePainter()`
- Verb-prefixed names for actions: `incrementClickCounter`, `toggleTheme`, `launchURL`, `mobile_launchLink`
- Double underscore prefix occasionally used with scope prefix: `mobile_onScroll()`, `mobile_updateActiveProject()`

**Variables:**
- `camelCase` for instance and local variables: `isDarkMode`, `isHovered`, `isChatOpen`, `clickCounter`, `scrollController`
- Leading underscore for private fields: `_controller`, `_timer`, `_currentIndex`, `_dragProgress`
- `late` keyword for late-initialized variables: `late FixedExtentScrollController _scrollController`, `late AnimationController _controller`
- `final` for immutable variables and parameters: `final bool isDarkMode`, `final VoidCallback toggleTheme`
- `const` for compile-time constants: `const Duration(milliseconds: 300)`, `const Color(0xFF000000)`

**Types:**
- PascalCase for type names and widgets: `Offset`, `Size`, `Duration`, `AnimationController`, `MaterialApp`
- Generics with clear type parameters: `List<String>`, `Map<String, String>`, `Map<String, dynamic>`

## Code Style

**Formatting:**
- Dart built-in formatting (flutter format)
- Spacing around operators and after keywords
- Consistent indentation with 2 spaces
- Line breaks before widget tree properties
- Comments above inline HTML-like widget structures

**Linting:**
- Flutter Lints (`flutter_lints: ^5.0.0`) enabled via `package:flutter_lints/flutter.yaml`
- Standard analyzer configuration in `analysis_options.yaml`
- Project uses `useMaterial3: true` for Material 3 compliance

## Import Organization

**Order:**
1. Package imports (`package:flutter/...`, `package:google_fonts/...`)
2. Dart library imports (`dart:html`, `dart:ui`, `dart:math`, `dart:async`, `dart:convert`)
3. Relative imports (`import './main.dart'`, `import 'navbar.dart'`)

**Path Aliases:**
- No aliases detected; uses relative imports within lib directory
- Direct file imports preferred: `import 'navbar.dart'`, `import 'portfolio_button.dart'`

**Examples:**
```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:html' as html;
import 'dart:ui';
import 'navbar.dart';
import 'home_text.dart';
```

## Error Handling

**Patterns:**
- Try-catch blocks for error-prone operations (API calls, URL launches):
  ```dart
  try {
    // Operation
  } catch (e) {
    // Handle error with user-friendly message
  }
  ```
- String-based throw statements: `throw 'Could not launch $url'`
- User-facing error messages returned: fallback error strings returned instead of throwing
- Graceful degradation for failed operations (e.g., navigation fallback to MaterialPageRoute)

**Examples from codebase:**
- `chat_mobile.dart`: Try-catch for API requests with fallback error messages
- `mobile_navbar.dart`: Try-catch for URL launching with string-based throws
- `navbar.dart`: Fallback MaterialPageRoute when position detection fails

## Logging

**Framework:** `print()` and `debugPrint()` using Dart's built-in console output

**Patterns:**
- Debug print statements for development: `print('Portfolio clicked')`, `print('Drag started on arrow')`
- Information logging on state changes: `print('Mobile Home - Click count incremented to: $_clickCount')`
- Drag/interaction debugging: `print('Drag ended with velocity: ${details.velocity.pixelsPerSecond.dx}')`
- Context debugging with variable interpolation: `print('Mobile Home Text - clickCount: ${widget.clickCount}, showAnimations: $_showAnimations')`

**Usage locations:**
- `main.dart`: User interaction logging
- `navbar.dart`: Navigation events
- `mobile_home_text.dart`: Drag and animation state
- `mobile.dart`: State changes

## Comments

**When to Comment:**
- Code sections within methods marked with inline comments: `// Background gradient with smooth transition`
- Logic explanations for non-obvious calculations: `// Portfolio button is at the left side of the navbar`
- Widget positioning/layout comments explaining relative positions
- Lifecycle and state change explanations

**Style:**
- Line comments preferred: `// Comment`
- Comments placed above the code they describe
- Clear, descriptive language without unnecessary verbosity

**Examples:**
- `// Remove global counter` (intentional removal note)
- `// Detect system theme preference`
- `// Add observer for system theme changes`
- `// Only show ChatPlaceholder when chat is not open`

## Function Design

**Size:**
- Functions average 5-40 lines
- Widget build methods are larger (50-300 lines for complex layouts)
- State management methods kept concise (5-15 lines)

**Parameters:**
- Named parameters preferred for optional values
- `required` keyword for mandatory parameters: `required this.isDarkMode`, `required this.toggleTheme`
- Default values used: `this.isDarkMode = false`
- Callback functions as parameters: `final VoidCallback toggleTheme`, `final Function(int) incrementClickCounter`

**Return Values:**
- Widget-returning functions in StatefulWidgets: `State<MyClass> createState()`
- Void for state mutations: `void toggleTheme()`, `void _updatePortfolioButtonPosition()`
- Futures for async operations: `Future<void> mobile_launchURL(String url)`
- Getters not used; direct property access preferred

## Module Design

**Exports:**
- No barrel files detected; single widget per file preferred
- Related helper classes in same file: `SunCirclePainter`, `DashedLine`, `DashedLinePainter` in `theme_toggle.dart`

**File Organization:**
- One main widget class per file (StatefulWidget or StatelessWidget)
- Helper classes and painters in same file as primary widget
- State classes follow widget class: `Widget` -> `_WidgetState`
- Nested helper classes when they're only used by parent widget

**Architecture:**
- Parent widgets pass state management via callbacks
- Child widgets accept configuration via constructor parameters
- Platform-specific variants handled as separate files (`mobile_*` and desktop versions)
- Clear separation between widget UI files and logic files

---

*Convention analysis: 2026-04-02*
