// nav_bar.dart
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'portfolio_button.dart';
import 'package:url_launcher/url_launcher.dart';
import 'about_page.dart';
import 'portfolio.dart'; // Import the new PortfolioPage
import 'circular_reveal_page_route.dart'; // Your custom radial route

class NavBar extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const NavBar({
    Key? key,
    required this.isDarkMode,
    required this.toggleTheme,
  }) : super(key: key);

  @override
  State<NavBar> createState() => _NavBarState();
}

class _NavBarState extends State<NavBar> {
  final GlobalKey _portfolioButtonKey = GlobalKey();

  void _navigateToPortfolio() {
    // Ensure the widget is rendered before trying to get its position
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final RenderBox? box = _portfolioButtonKey.currentContext?.findRenderObject() as RenderBox?;
      if (box != null) {
        // Get the global position of the button
        final position = box.localToGlobal(Offset.zero);
        final size = box.size;
        final centerX = position.dx + size.width / 2;
        final centerY = position.dy + size.height / 2;
        final offset = Offset(centerX, centerY);

        Navigator.of(context).push(
          CircularRevealPageRoute(
            page: PortfolioPage(
              isDarkMode: widget.isDarkMode,
              toggleTheme: widget.toggleTheme,
            ),
            startOffset: offset,
            startRadius: 0,
            duration: const Duration(milliseconds: 500),
            reverseDuration: const Duration(milliseconds: 500),
          ),
        );
      } else {
        // Fallback in case the position couldn't be determined
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => PortfolioPage(
              isDarkMode: widget.isDarkMode,
              toggleTheme: widget.toggleTheme,
            ),
          ),
        );
      }
    });
  }

  void _navigateToAbout() {
    // Get the position of the NavBar itself
    final RenderBox? box = context.findRenderObject() as RenderBox?;
    if (box != null) {
      final position = box.localToGlobal(Offset.zero);
      final size = box.size;
      final centerX = position.dx + size.width / 2;
      final centerY = position.dy + size.height / 2;
      final offset = Offset(centerX, centerY);

      Navigator.of(context).push(
        CircularRevealPageRoute(
          page: AboutPage(
            isDarkMode: widget.isDarkMode,
            toggleTheme: widget.toggleTheme,
          ),
          startOffset: offset,
          startRadius: 0,
          duration: const Duration(milliseconds: 500),
          reverseDuration: const Duration(milliseconds: 500),
        ),
      );
    } else {
      // Fallback in case the position couldn't be determined
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => AboutPage(
            isDarkMode: widget.isDarkMode,
            toggleTheme: widget.toggleTheme,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 630,
      height: 60,
      child: Stack(
        children: [
          // Background container
          Container(
            width: 630,
            height: 60,
            decoration: BoxDecoration(
              color: widget.isDarkMode
                  ? Colors.white.withOpacity(0.8)
                  : Colors.black.withOpacity(0.8),
              borderRadius: BorderRadius.circular(25),
            ),
          ),

          // "Portfolio" button
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 200,
            child: Hero(
              tag: 'portfolioButtonHero',
              child: AnimatedGradientButton(
                key: _portfolioButtonKey,
                isDarkMode: widget.isDarkMode,
                onPressed: _navigateToPortfolio, 
              ),
            ),
          ),

          Positioned.fill(
            child: Center(
            child:MouseRegion(              
            cursor: SystemMouseCursors.click, // Change cursor to pointer
              child: GestureDetector(
                onTap: _navigateToAbout, 
                child: Text(
                  'About Me',
                  style: TextStyle(
                    color: widget.isDarkMode ? Colors.grey[800] : Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
              ),
            ),
          ),

          // Social icons
          Positioned(
            right: 12,
            top: 0,
            bottom: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.github),
                  color:
                      widget.isDarkMode ? Colors.grey[800] : const Color(0xFF808080),
                  onPressed: () async {
                    const url = 'https://github.com/LakshmanTurlapati';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url));
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Could not launch $url')),
                      );
                    }
                  },
                ),
                const SizedBox(width: 8), 
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.linkedin),
                  color:
                      widget.isDarkMode ? Colors.grey[800] : const Color(0xFF808080),
                  onPressed: () async {
                    const url =
                        'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url));
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Could not launch $url')),
                      );
                    }
                  },
                ),      
                const SizedBox(width: 8), 

                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.twitter),
                  color:
                      widget.isDarkMode ? Colors.grey[800] : const Color(0xFF808080),
                  onPressed: () async {
                    const url = 'https://x.com/parzival1213';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url));
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Could not launch $url')),
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}