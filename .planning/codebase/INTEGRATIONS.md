# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**AI & Chat:**
- xAI Grok-3-mini API - Powers "Parz" AI persona for chat interactions
  - SDK/Client: `http` package (Dart native HTTP client)
  - Endpoint: `https://api.x.ai/v1/chat/completions`
  - Auth Method: Bearer token (API key in `lib/env.dart`)
  - Environment Variable: `xaiApiKey` (exposed in frontend code)
  - Implementation: `lib/chat.dart` (ChatApiService class) and `lib/chat_mobile.dart`
  - Model: `grok-3-mini`
  - Features: Conversation history tracking, streaming responses, error handling with fallback messages

**Social & Web Links:**
- GitHub - Project repository links
  - URL: `https://github.com/LakshmanTurlapati`
  - Integration: `url_launcher` package for external navigation
  - Used in: `lib/navbar.dart`, `lib/mobile_navbar.dart`, `lib/about_page.dart`, `lib/portfolio.dart`

- LinkedIn - Professional profile
  - URL: `https://www.linkedin.com/in/lakshman-turlapati-3091aa191/`
  - Integration: `url_launcher` for profile link
  - Used in: Navigation, about page, contact information

- X (Twitter) - Social media profile
  - URL: `https://x.com/parzival1213`
  - Integration: `url_launcher` for profile link
  - Used in: `lib/mobile_navbar.dart`, `lib/navbar.dart`, `lib/about_page.dart`

- LeetCode - Coding profile
  - URL: `https://leetcode.com/u/PARZIVAL1213/`
  - Integration: `url_launcher` for profile link
  - Used in: `lib/dot_matrix.dart`, `lib/mobile_dot_matrix.dart`

**Content & Design:**
- Figma - Design system reference
  - Design File: `https://www.figma.com/design/UeixAHUPLTSKiwHR9HVfT2/Portfolio`
  - Purpose: Design reference documentation (not API integrated)

## Data Storage

**Databases:**
- None - Stateless frontend application
- Chat History: Stored in-memory within Flutter session (not persisted)
- Theme Preference: Stored in browser's platform brightness (system preference)

**File Storage:**
- Local filesystem only (no cloud storage)
- Assets: Bundled with application
  - Images: `assets/`, `web/icons/`
  - Static files: `web/manifest.json`, `web/favicon.ico`

**Caching:**
- Cached Network Image (3.2.3) - Image caching strategy
- HTTP response caching - Implicit browser caching

## Authentication & Identity

**Auth Provider:**
- Custom (API key-based) - xAI API uses bearer token authentication
  - Implementation: Direct API key in request headers
  - Storage: `lib/env.dart` with hardcoded key
  - Scope: Read-only access to xAI Grok-3-mini model

**Security Note:**
- API key is exposed in frontend code (acknowledged in `env.dart`)
- No backend gateway or server-side authentication
- Frontend-only application architecture
- Web minification provides only basic obfuscation

## Monitoring & Observability

**Error Tracking:**
- None detected - No external error tracking service

**Logs:**
- Console logging only - Via Flutter's `debugPrint` (disabled in production via analyze options)
- Error handling: Local try-catch blocks in `ChatApiService` class
- Fallback messages: Random error messages on API failures

**Health Checks:**
- API availability check: `ChatApiService.checkHealth()` method
- Endpoint: `https://api.x.ai/v1/models` (GET request)
- Frequency: Called before chat initialization
- Response handling: Boolean status (true/false availability)

## CI/CD & Deployment

**Hosting:**
- Static web hosting - Deployed at `https://parzival.live`
- Build Output: `build/web/` directory
- Platform: Flutter Web (compiled to JavaScript, HTML, CSS)

**CI Pipeline:**
- None detected - No CI/CD configuration files found
- Manual builds via Flutter CLI
- Deployment: Direct upload of `build/web/` artifacts

**Build Process:**
- `flutter build web` - Generates production-optimized static files
- Artifacts: JavaScript bundles, asset files, HTML index
- Configuration: `pubspec.yaml` with asset declarations

## Environment Configuration

**Required Environment Variables:**
- `xaiApiKey` - xAI API authentication token (currently hardcoded in `lib/env.dart`)
  - Value Type: Bearer token string
  - Usage: Added to Authorization header in HTTP requests
  - Critical: Yes

**Secrets Location:**
- `lib/env.dart` - Contains hardcoded API key (SECURITY WARNING)
- File explicitly includes comment: "This file contains sensitive API keys"
- Currently committed to repository (should be in .gitignore)

**Development Configuration:**
- Theme detection: `WidgetsBinding.instance.window.platformBrightness`
- System preference: Automatic dark/light mode detection
- Meta tags: Dynamic theme-color update based on mode

## Webhooks & Callbacks

**Incoming:**
- None detected - Stateless frontend application

**Outgoing:**
- URL Launcher callbacks: External link navigation
  - Handlers: `url_launcher/launch()` calls
  - Targets: GitHub, LinkedIn, X, LeetCode, Figma
  - Error handling: Graceful failure with user notification

**Chat Callbacks:**
- Message submission: User input triggers xAI API call
- Response handling: Async Future with error fallbacks
- UI updates: State management with `setState()` for message display

## API Request/Response Patterns

**Chat API Requests:**
```
POST https://api.x.ai/v1/chat/completions
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {xaiApiKey}

Body:
{
  "model": "grok-3-mini",
  "messages": [
    {"role": "system", "content": "{detailed system prompt}"},
    {"role": "user", "content": "{user message}"},
    {"role": "assistant", "content": "{previous response}"}
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**Response Format:**
- OpenAI-compatible format
- Extract from: `response.body['choices'][0]['message']['content']`
- Error responses: HTTP status codes with error messages
- Timeout handling: Default HTTP timeout behavior

**Message History Management:**
- Class: `ChatHistoryManager` (referenced in `lib/chat.dart`)
- Limit: Last 20 messages (10 exchanges) to manage token usage
- Storage: In-memory only, cleared on page refresh

## Deployment Configuration

**Domain:**
- Production: `parzival.live`
- SSL/TLS: Standard HTTPS (assumed from domain setup)

**Build Manifest:**
- Web Manifest: `web/manifest.json`
- PWA Support: Standalone display mode
- Icons: 192x192 and 512x512 PNG formats
- Theme Color: Dynamic (#FFFFFF light, #000000 dark)

**Asset Configuration:**
- Base Directory: `build/web`
- Include Pattern: `**/*` (all build artifacts)
- Compression: Standard web server gzip

---

*Integration audit: 2026-04-02*
