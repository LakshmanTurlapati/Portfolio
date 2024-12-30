import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'navbar.dart';
import 'home_text.dart';
import 'particle_background.dart';
import 'dot_matrix.dart';
import 'theme_toggle.dart'; // Import the new ThemeToggle widget

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
      home: HomePage(toggleTheme: toggleTheme, isDarkMode: isDarkMode),
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
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
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
              child: const ScrollingText(),
            ),
          ),

          // Navbar
          const Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: Center(
              child: NavBar(),
            ),
          ),

          // Dot matrix pattern
          const Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Center(
              child: DotMatrixPattern(),
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
                print('Venkat L. Turlapati clicked!');
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
                    shadows: isHovered
                        ? [
                            const Shadow(
                              offset: Offset(2, 2),
                              blurRadius: 4,
                              color: Colors.black38,
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