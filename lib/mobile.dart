import 'package:flutter/material.dart';
import 'mobile_navbar.dart';
import 'particle_background.dart';
import 'theme_toggle.dart';
import 'mobile_home_text.dart';
import 'mobile_dot_matrix.dart';

class MobileHome extends StatefulWidget {
  final VoidCallback toggleTheme;
  final bool isDarkMode;

  const MobileHome({
    Key? key,
    required this.toggleTheme,
    required this.isDarkMode,
  }) : super(key: key);

  @override
  State<MobileHome> createState() => _MobileHomeState();
}

class _MobileHomeState extends State<MobileHome> {
  int _clickCount = 0;

  void _incrementClickCount() {
    setState(() {
      _clickCount++;
    });
    print('Mobile Home - Click count incremented to: $_clickCount');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient with smooth transition
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            decoration: BoxDecoration(
              gradient: widget.isDarkMode
                  ? const SweepGradient(
                      center: Alignment.center,
                      startAngle: 0.0,
                      endAngle: 2 * 3.14159,
                      colors: [
                        Color(0xFF000000),
                        Color(0xFF101010),
                        Color(0xFF1A1A1A),
                        Color(0xFF202020),
                        Color(0xFF101010),
                        Color(0xFF000000),
                      ],
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

          // Particle background (reused)
          const AnimatedCircleBackground(),

          // Name at the top-left
          Positioned(
            top: 20,
            left: 20,
            child: Text(
              'Lakshman Turlapati',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w500,
                color: widget.isDarkMode ? Colors.white : Colors.black,
              ),
            ),
          ),

          // Dark mode toggle at the top-right (reused)
          Positioned(
            top: 20,
            right: 20,
            child: ThemeToggle(
              toggleTheme: widget.toggleTheme,
              isDarkMode: widget.isDarkMode,
            ),
          ),

          // Scrolling text
          Align(
            alignment: Alignment.center,
            child: Transform.translate(
              offset: const Offset(0, -80),
              child: ScrollingText(
                isDarkMode: widget.isDarkMode,
                clickCount: _clickCount,
              ),
            ),
          ),

          // Dot matrix pattern near the bottom
          Positioned(
            bottom: 140,
            left: 0,
            right: 0,
            child: Center(
              child: DotMatrixPattern(isDarkMode: widget.isDarkMode),
            ),
          ),

          // Mobile NavBar at the bottom
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: NavBar(
              isDarkMode: widget.isDarkMode,
              toggleTheme: widget.toggleTheme,
              onNavigationClick: _incrementClickCount,
            ),
          ),
        ],
      ),
    );
  }
}