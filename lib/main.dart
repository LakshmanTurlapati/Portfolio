import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'navbar.dart';
import 'home_text.dart';
import 'particle_background.dart';
import 'dot_matrix.dart';
import 'theme_toggle.dart';
import 'mobile.dart'; 

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

          // Navbar
          Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: Center(
              child: NavBar(
                isDarkMode: widget.isDarkMode,
                toggleTheme: widget.toggleTheme,
              ),
            ),
          ),

          // Dot matrix pattern
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Center(
              child: DotMatrixPattern(isDarkMode: widget.isDarkMode),
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
        ],
      ),
    );
  }
}