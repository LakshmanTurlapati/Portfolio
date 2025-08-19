<div align="center">

# Portfolio Website Version 3.0

</div>

[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white)](https://dart.dev/)
[![Web](https://img.shields.io/badge/Web-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://audienclature.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg?style=for-the-badge)](pubspec.yaml)
[![Responsive](https://img.shields.io/badge/Responsive-Desktop%20%7C%20Mobile-brightgreen?style=for-the-badge)](https://audienclature.com)

A modern, interactive portfolio website built entirely in Flutter, showcasing software development skills, cloud engineering expertise, and UI/UX design capabilities. Features an AI-powered chat persona, responsive design, and engaging animations.

---

<div align="center">
   <h3></h3>Live at <strong><a href="https://audienclature.com"> audienclature.com</a></strong></h3>
  <p></p>
  
  <img src="assets/portfolio.jpg" alt="Portfolio Website Screenshot" width="85%">
  <p><em>Interactive portfolio website with AI chat, responsive design, and modern animations</em></p>
</div>

---

## Architecture Overview

```mermaid
graph TB
    A[Portfolio App] --> B[Desktop Layout]
    A --> C[Mobile Layout]
    
    B --> D[Main Homepage]
    B --> E[Portfolio Gallery]
    B --> F[About Page]
    B --> G[AI Chat System]
    
    C --> H[Mobile Homepage]
    C --> I[Mobile Portfolio]
    C --> J[Mobile About]
    C --> K[Mobile Chat]
    
    D --> L[Interactive Background]
    D --> M[Theme Toggle]
    D --> N[Navigation]
    
    G --> O[Chat Interface]
    G --> P[AI Persona]
    G --> Q[Context Management]
    
    L --> R[Particle Animation]
    L --> S[Snow Effects]
    L --> T[Dot Matrix Pattern]
    
    style A fill:#e1f5fe
    style G fill:#fff3e0
    style L fill:#f3e5f5
```

## User Experience Flow

```mermaid
journey
    title Portfolio User Journey
    section Landing
      Visit Homepage: 5: User
      View Animations: 4: User
      Explore Navigation: 3: User
    section Portfolio
      Browse Projects: 5: User
      View Project Details: 4: User
      Visit External Links: 3: User
    section Interaction
      Toggle Theme: 5: User
      Start Chat: 4: User
      Ask Questions: 5: User
    section About
      Read About Page: 4: User
      Learn Background: 5: User
      Contact Information: 3: User
```

## Key Features

### Core Functionality
- **Responsive Design** - Seamless desktop and mobile experiences
- **Interactive AI Chat** - Personal AI assistant for visitor engagement
- **Portfolio Showcase** - Dynamic project gallery with external integrations
- **Theme System** - Dark/light mode with smooth transitions
- **Modern Animations** - Particle backgrounds, snow effects, and smooth transitions

### Technical Features
- **Flutter Web** - Single codebase for web deployment
- **Adaptive Layouts** - Optimized for different screen sizes
- **Performance Optimized** - Efficient rendering and memory management
- **SEO Friendly** - Proper meta tags and structured data
- **Progressive Enhancement** - Graceful degradation across browsers

## Tech Stack

```mermaid
graph LR
    A[Frontend] --> B[Flutter Web]
    B --> C[Dart Language]
    B --> D[Material Design]
    
    E[UI Components] --> F[Custom Animations]
    E --> G[Responsive Layouts]
    E --> H[Theme System]
    
    I[Parz Server] --> J[Chat System]
    I --> K[Project Data]
    
    L[Assets] --> M[Images]
    L --> N[Icons]
    L --> O[Fonts]
    
```

### Dependencies
- **flutter** - Core framework
- **google_fonts** - Typography system
- **font_awesome_flutter** - Icon library
- **url_launcher** - External link handling
- **http** - API communications
- **flutter_staggered_grid_view** - Advanced grid layouts
- **flutter_linkify** - Automatic link detection

---




## Features Deep Dive

### AI Chat System
- Intelligent conversational AI persona
- Context-aware responses about projects and experience
- Smart suggestion system with balanced question types
- Auto-hiding suggestions after user engagement
- Smooth animations and responsive design

### Portfolio Gallery
- Dynamic project showcase with masonry layout
- External link integration (GitHub, live demos, designs)
- Optimized image loading and caching
- Responsive grid system
- Interactive hover effects

### Theme System
- System-preference detection
- Smooth transition animations
- Consistent color schemes across components
- Persistent theme selection
- Dynamic meta tag updates for browser integration

## Deployment

The portfolio is deployed at **[audienclature.com](https://audienclature.com)** using modern web hosting practices.

### Build Configuration
```yaml
# pubspec.yaml
flutter:
  uses-material-design: true
  assets:
    - assets/
    - web/icons/

artifacts:
  baseDirectory: build/web
  files:
    - '**/*'
```

## Design Reference

The portfolio design was meticulously crafted in Figma, emphasizing modern aesthetics and user experience principles.

**Design System**: [View Figma Design](https://www.figma.com/design/UeixAHUPLTSKiwHR9HVfT2/Portfolio?node-id=0-1&t=QkxcB16bQkJ96mpv-1)




## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Considerations

- Optimized asset loading
- Efficient animation rendering
- Memory-conscious image handling
- Progressive loading strategies
- Minimal bundle size





---

**Built with Flutter** | **Designed for the modern web** | **Deployed at [audienclature.com](https://audienclature.com)**
