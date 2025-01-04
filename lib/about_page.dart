import 'package:flutter/material.dart';

class AboutPage extends StatelessWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const AboutPage({
    super.key,
    required this.isDarkMode,
    required this.toggleTheme,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: isDarkMode ? Colors.white : const Color(0xFF2A2A2A),
      body: Stack(
        children: [
          // Back button
          Positioned(
            top: 20,
            left: 20,
            child: Hero(
              tag: 'portfolioButtonHero',
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isDarkMode ? Colors.black : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: Icon(
                    Icons.arrow_back,
                    color: isDarkMode ? Colors.white : Colors.black,
                  ),
                  onPressed: () {
                    // Navigate back without creating a new instance
                    Navigator.of(context).pop();
                  },
                ),
              ),
            ),
          ),
          // Main content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'About Page Content',
                  style: TextStyle(
                    fontSize: 24,
                    color: isDarkMode ? Colors.black : Colors.white,
                  ),
                ),
                
              ],
            ),
          ),
        ],
      ),
    );
  }
}