# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Runner:**
- `flutter_test` (built into Flutter SDK)
- Minimal test setup (`flutter_test: sdk: flutter` in pubspec.yaml dev_dependencies)

**Assertion Library:**
- Flutter's built-in `expect()` function from `flutter_test`
- Matches and matchers: `findsOneWidget`, `findsNothing`, `findsWidgetWithText`

**Run Commands:**
```bash
flutter test                    # Run all tests
flutter test --watch          # Watch mode
flutter test --coverage       # Generate coverage report
flutter test test/widget_test.dart  # Run specific test file
```

## Test File Organization

**Location:**
- Single test file: `test/widget_test.dart`
- Co-located testing approach not observed
- All widget tests in dedicated `test/` directory

**Naming:**
- Test file naming: `*_test.dart` convention
- Test groups/suites: `testWidgets()` function blocks
- Test case names: descriptive strings in function parameter

**Structure:**
```
test/
└── widget_test.dart
```

## Test Structure

**Suite Organization:**

Minimal test structure observed. Single test in `test/widget_test.dart`:

```dart
void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
```

**Patterns:**
- Main test entry point: `void main() { }`
- Test widget setup: `testWidgets(String description, callback)`
- Async test functions: `(WidgetTester tester) async`
- Setup with `await tester.pumpWidget(const MyApp())`
- No teardown/cleanup observed in current tests
- Frame rendering with `await tester.pump()` and `await tester.pumpWidget()`

## Widget Testing Approach

**Test Patterns:**

The codebase contains a **smoke test** demonstrating basic widget interaction patterns:

1. **Widget Initialization:**
   ```dart
   await tester.pumpWidget(const MyApp());
   ```
   - Builds and renders the widget tree
   - Single call per test to initialize the app

2. **Widget Finding:**
   ```dart
   expect(find.text('0'), findsOneWidget);
   expect(find.text('1'), findsNothing);
   find.byIcon(Icons.add)
   ```
   - Text matching: `find.text(String)`
   - Icon matching: `find.byIcon(IconData)`
   - Matchers: `findsOneWidget`, `findsNothing`, `findsWidgets`

3. **User Interaction:**
   ```dart
   await tester.tap(find.byIcon(Icons.add));
   ```
   - Tap gesture: `await tester.tap(Finder)`
   - No drag/scroll tests in current suite
   - No text input tests observed

4. **Frame Advancement:**
   ```dart
   await tester.pump();
   ```
   - Trigger frame: `await tester.pump()`
   - No duration parameters used for animation testing

## Mocking

**Framework:** No mocking library detected

**Patterns:**
- No mocks, stubs, or mock libraries (mockito, mocktail) in pubspec.yaml
- Real widget tree testing (integration-style testing)
- No network call mocking
- API services used as-is in code (not tested)

**What NOT to Test:**
- API layer behavior (no mocks provided)
- Third-party library behavior (google_fonts, url_launcher, font_awesome_flutter)
- System platform channel calls without mocking infrastructure

## Fixtures and Factories

**Test Data:**
- No fixtures or factory classes observed
- Test data embedded inline in test functions
- Widget configuration passed directly to MyApp constructor

**Location:**
- No dedicated fixtures directory
- No factory pattern implementation for test data generation

## Coverage

**Requirements:** No coverage requirements enforced

**View Coverage:**
```bash
flutter test --coverage              # Generate coverage.lcov
lcov --list coverage/lcov.info       # View coverage report (requires lcov)
genhtml coverage/lcov.info -o coverage/html  # Generate HTML report
```

**Current Status:**
- Single test provides minimal coverage
- Majority of widget code untested
- No continuous coverage tracking detected

## Test Types

**Unit Tests:**
- Not observed in current test suite
- Would test pure functions (calculations, utilities, helpers)
- Would test Dart functions outside widget context
- Recommend for: state calculations, business logic, data transformation

**Integration Tests:**
- Full widget tree testing as observed in `test/widget_test.dart`
- App initialized with `tester.pumpWidget(const MyApp())`
- Tests widget behavior in realistic context

**E2E Tests:**
- Not implemented
- Would require `integration_test/` directory
- Would test app flows across multiple screens
- Not part of current testing strategy

## Common Testing Patterns

**Async Testing:**

Widget tests automatically handle async operations:

```dart
void main() {
  testWidgets('description', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();
  });
}
```

- All test callbacks are `async`
- `await` keyword required for all tester operations
- Frame advancement with `pump()` waits for animation/layout completion

**Assertion Patterns:**

```dart
expect(find.text('0'), findsOneWidget);      // Find exactly one widget
expect(find.text('1'), findsNothing);        // Widget not found
expect(find.byIcon(Icons.add), findsOneWidget);  // Find by icon
```

**Common Issues NOT Currently Addressed:**

1. **Theme Testing:** `isDarkMode` state changes not tested
2. **Navigation:** No tests for route navigation (portfolio, about pages)
3. **State Management:** Click counter incrementing logic not tested
4. **Animations:** AnimationController and animated widgets not tested
5. **API Calls:** ChatApiService integration not tested
6. **Responsive Layout:** Mobile/desktop responsive behavior not tested

## Testing Gaps

**Major Areas Without Tests:**
- `lib/navbar.dart`: Navigation and click counter logic
- `lib/home_text.dart`: ScrollingText widget and timer behavior
- `lib/portfolio_button.dart`: Gradient animation and button interaction
- `lib/chat.dart` / `lib/chat_mobile.dart`: ChatApiService API calls and message handling
- `lib/theme_toggle.dart`: Theme switching and animation state
- `lib/mobile_*.dart`: All mobile-specific components untested
- `lib/particle_background.dart`: Animation and rendering untested
- `lib/rotating_circular_text.dart`: Complex animation state untested

**Untested Functionality:**
- Network requests to xAI Grok API
- URL launching and external link navigation
- Timer-based animations
- Gesture detection (drag, hover)
- Platform brightness detection
- Dynamic position calculations and animations

## Recommendations

**Next Steps for Test Coverage:**
1. Add tests for `HomePage` and `MobileHome` rendering
2. Test `NavBar` navigation methods: `_navigateToPortfolio()`, `_navigateToAbout()`
3. Test click counter increment logic with state changes
4. Mock `ChatApiService` for message handling tests
5. Add theme toggle tests with `isDarkMode` state verification
6. Test responsive layout breakpoint at 600px width threshold
7. Consider adding integration tests for multi-screen navigation flows

---

*Testing analysis: 2026-04-02*
