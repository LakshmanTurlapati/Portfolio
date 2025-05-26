import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'navbar.dart';
import 'home_text.dart';
import 'particle_background.dart';
import 'dot_matrix.dart';
import 'theme_toggle.dart';
import 'mobile.dart';
import 'chat.dart';
import 'rotating_circular_text.dart';

// Global click counter to track navigation clicks
// int clickCounter = 0; // Remove global counter

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool isDarkMode = false;

  void toggleTheme() {
    setState(() {
      isDarkMode = !isDarkMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Portfolio v2',
      theme: ThemeData(
        brightness: isDarkMode ? Brightness.dark : Brightness.light,
        textTheme: GoogleFonts.latoTextTheme(),
        primarySwatch: Colors.grey,
      ),
      home: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth < 600) {
            // Mobile layout
            return MobileHome(
              toggleTheme: toggleTheme,
              isDarkMode: isDarkMode,
            );
          } else {
            // Desktop layout
            return HomePage(
              toggleTheme: toggleTheme,
              isDarkMode: isDarkMode,
            );
          }
        },
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  final VoidCallback toggleTheme;
  final bool isDarkMode;

  const HomePage({super.key, required this.toggleTheme, required this.isDarkMode});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool isHovered = false;
  bool isChatOpen = false;
  Rect? _chatPopupRect;
  GlobalKey navbarKey = GlobalKey();
  Offset? portfolioButtonPosition;
  Size? portfolioButtonSize;
  int clickCounter = 0; // Local click counter

  @override
  void initState() {
    super.initState();
    // Wait for the first frame to calculate position
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updatePortfolioButtonPosition();
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  // Method to update the portfolio button position
  void _updatePortfolioButtonPosition() {
    final RenderBox? navbarBox = navbarKey.currentContext?.findRenderObject() as RenderBox?;
    if (navbarBox != null) {
      final navbarPosition = navbarBox.localToGlobal(Offset.zero);
      
      // Portfolio button is at the left side of the navbar
      // The navbar is centered, so we need to calculate the left position
      final size = MediaQuery.of(context).size;
      final navbarWidth = 630; // Based on your navbar width
      final navbarLeft = (size.width - navbarWidth) / 2;
      
      setState(() {
        portfolioButtonPosition = Offset(
          navbarLeft, // X position where navbar starts
          navbarPosition.dy, // Y position of navbar
        );
        portfolioButtonSize = Size(200, 60); // Based on portfolio button size
      });
    }
  }

  void _toggleChat(Rect? rect) {
    setState(() {
      isChatOpen = rect != null;
      _chatPopupRect = rect;
    });
  }

  // Method to increment click counter
  void incrementClickCounter(int amount) {
    setState(() {
      clickCounter += amount;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient with smooth transition
          AnimatedContainer(
            duration: const Duration(milliseconds: 300), // Smooth transition duration
            decoration: BoxDecoration(
              gradient: widget.isDarkMode
                  ? SweepGradient(
                      center: Alignment.center,
                      startAngle: 0.0,
                      endAngle: 2 * 3.14159,
                      colors: [
                        const Color(0xFF000000),
                        const Color(0xFF101010).withOpacity(0.9),
                        const Color(0xFF1A1A1A).withOpacity(0.8),
                        const Color(0xFF202020).withOpacity(0.7),
                        const Color(0xFF101010).withOpacity(0.9),
                        const Color(0xFF000000),
                      ],
                      stops: const [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
                    )
                  : const LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      stops: [0.05, 0.4, 0.6, 0.95],
                      colors: [
                        Color(0xFFFFFFFF),
                        Color(0xFFD0D0D0),
                        Color(0xFFD0D0D0),
                        Color(0xFFFFFFFF),
                      ],
                    ),
            ),
          ),

          // Particle background
          const AnimatedCircleBackground(),

          // Scrolling text
          Align(
            alignment: Alignment.center,
            child: Transform.translate(
              offset: const Offset(0, -40),
              child: ScrollingText(isDarkMode: widget.isDarkMode),
            ),
          ),

          // Click here indicator overlay - only visible when counter equals 1
          if (clickCounter == 1)
            Positioned(
              left: MediaQuery.of(context).size.width / 2 - 270 - (0.01 * MediaQuery.of(context).size.width),
              top: 10 - (0.05 * MediaQuery.of(context).size.height),
              width: 150,
              height: 150,
              child: IgnorePointer(
                child: AnimatedSmoothIndicator(
                  child: Center(
                    child: SizedBox(
                      width: 144, // Increased by 20% (120 * 1.2)
                      height: 144, // Increased by 20% (120 * 1.2)
                      child: RotatingCircularText(
                        text1: "Click Here",
                        style1: TextStyle(
                          fontSize: 16.6, // Reduced by 5% (17.5 * 0.95)
                          color: widget.isDarkMode ? Colors.white : Colors.black,
                          fontWeight: FontWeight.w600, // Semi-bold
                        ),
                        text2: "•",
                        style2: TextStyle(
                          fontSize: 23.8, // Reduced by 5% (25 * 0.95)
                          color: widget.isDarkMode ? Colors.white70 : Colors.black87,
                          fontWeight: FontWeight.w600, // Semi-bold
                        ),
                        numberOfPairs: 4,
                        radius: 72.0, // Increased by 20% (60 * 1.2)
                        duration: Duration(seconds: 8), // Slowed by 50% (4 * 2)
                        startDelay: Duration(seconds: 2), // Added 2 second delay
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // Navbar
          Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: Center(
              child: NavBar(
                key: navbarKey,
                isDarkMode: widget.isDarkMode,
                toggleTheme: widget.toggleTheme,
                incrementClickCounter: incrementClickCounter,
              ),
            ),
          ),

          // Dot matrix pattern
          Positioned(
            bottom: 160,
            left: 0,
            right: 0,
            child: Center(
              child: DotMatrixPattern(isDarkMode: widget.isDarkMode),
            ),
          ),

          // Only show ChatPlaceholder when chat is not open
          if (!isChatOpen)
            Positioned(
              bottom: 20,
              left: 0,
              right: 0,
              child: Center(
                child: ChatPlaceholder(
                  isDarkMode: widget.isDarkMode,
                  initialWidth: 200,
                  onSendMessage: (rect) => _toggleChat(rect),
                ),
              ),
            ),

          // Theme toggle buttons
          Positioned(
            bottom: 20,
            left: 20,
            child: ThemeToggle(
              toggleTheme: widget.toggleTheme,
              isDarkMode: widget.isDarkMode,
            ),
          ),

          // Hoverable text at the bottom right
          Positioned(
            bottom: 20,
            right: 30,
            child: GestureDetector(
              onTap: () {
                print('Lakshman Turlapati clicked!');
              },
              child: MouseRegion(
                onEnter: (_) => setState(() => isHovered = true),
                onExit: (_) => setState(() => isHovered = false),
                cursor: SystemMouseCursors.click,
                child: Text(
                  'Lakshman Turlapati',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: widget.isDarkMode ? Colors.white : Colors.black,
                    shadows: isHovered
                        ? [
                            Shadow(
                              offset: const Offset(2, 2),
                              blurRadius: 4,
                              color: widget.isDarkMode
                                  ? Colors.black54
                                  : Colors.black38,
                            ),
                          ]
                        : [],
                  ),
                ),
              ),
            ),
          ),
          if (isChatOpen && _chatPopupRect != null)
            Positioned.fill(
              child: GestureDetector(
                onTap: () => _toggleChat(null),
                child: Container(
                  color: const Color(0xFF2a2a2a).withOpacity(0.5),
                ),
              ),
            ),
          if (isChatOpen && _chatPopupRect != null)
            ChatPopup(
              isDarkMode: widget.isDarkMode,
              onClose: () => _toggleChat(null),
              initialRect: _chatPopupRect!,
            ),
        ],
      ),
    );
  }

  @override
  void didUpdateWidget(HomePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (clickCounter == 1) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _updatePortfolioButtonPosition();
        }
      });
    }
  }
}

// Define the lifecycle observer class
class _HomePageLifecycleObserver extends WidgetsBindingObserver {
  final VoidCallback onResume;

  _HomePageLifecycleObserver({required this.onResume});

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      onResume();
    }
  }
}

// Add this class at the end of the file
class AnimatedSmoothIndicator extends StatefulWidget {
  final Widget child;
  
  const AnimatedSmoothIndicator({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  State<AnimatedSmoothIndicator> createState() => _AnimatedSmoothIndicatorState();
}

class _AnimatedSmoothIndicatorState extends State<AnimatedSmoothIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: 1.0 + 0.05 * _controller.value,
          child: widget.child,
        );
      },
    );
  }
}