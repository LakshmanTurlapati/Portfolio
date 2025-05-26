import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'mobile_portfolio_button.dart'; // Contains AnimatedGradientButton
import 'package:url_launcher/url_launcher.dart';
import 'about_page.dart';
import 'portfolio.dart';              // Ensure this file has class PortfolioPage
import 'circular_reveal_page_route.dart'; // Your custom radial route

class NavBar extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;
  final VoidCallback? onNavigationClick;

  const NavBar({
    Key? key,
    required this.isDarkMode,
    required this.toggleTheme,
    this.onNavigationClick,
  }) : super(key: key);

  @override
  State<NavBar> createState() => _NavBarState();
}

class _NavBarState extends State<NavBar> {
  // GlobalKey to track the Portfolio button's position
  final GlobalKey _portfolioButtonKey = GlobalKey();

  /// Navigate to AboutPage with circular reveal
  void _navigateToAbout() {
    // Increment click count when navigating to about
    print('About button clicked - incrementing count');
    widget.onNavigationClick?.call();
    
    final RenderBox? box = context.findRenderObject() as RenderBox?;
    if (box != null) {
      final position = box.localToGlobal(Offset.zero);
      final size = box.size;
      final centerX = position.dx + size.width / 2;
      final centerY = position.dy + size.height / 2;

      Navigator.of(context).push(
        CircularRevealPageRoute(
          page: AboutPage(
            isDarkMode: widget.isDarkMode,
            toggleTheme: widget.toggleTheme,
          ),
          startOffset: Offset(centerX, centerY),
          startRadius: 0,
          duration: const Duration(milliseconds: 500),
          reverseDuration: const Duration(milliseconds: 500),
        ),
      );
    } else {
      // Fallback if position can't be determined
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

  /// Navigate to PortfolioPage with circular reveal **from the Portfolio button**.
  void _navigateToPortfolio() {
    // Increment click count when navigating to portfolio
    print('Portfolio button clicked - incrementing count');
    widget.onNavigationClick?.call();
    
    // Use the _portfolioButtonKey instead of the NavBar's context
    final RenderBox? box = _portfolioButtonKey.currentContext?.findRenderObject() as RenderBox?;
    if (box != null) {
      final position = box.localToGlobal(Offset.zero);
      final size = box.size;
      final centerX = position.dx + size.width / 2;
      final centerY = position.dy + size.height / 2;

      Navigator.of(context).push(
        CircularRevealPageRoute(
          page: PortfolioPage(
            isDarkMode: widget.isDarkMode,
            toggleTheme: widget.toggleTheme,
          ),
          startOffset: Offset(centerX, centerY),
          startRadius: 0,
          duration: const Duration(milliseconds: 500),
          reverseDuration: const Duration(milliseconds: 500),
        ),
      );
    } else {
      // Fallback if position can't be determined
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => PortfolioPage(
            isDarkMode: widget.isDarkMode,
            toggleTheme: widget.toggleTheme,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      width: screenWidth * 0.9,
      height: 70,
      decoration: BoxDecoration(
        color: widget.isDarkMode
            ? Colors.white.withOpacity(0.8)
            : Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(25),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Portfolio Button -> Circular reveal from this button
          Expanded(
            flex: 2,
            child: Container(
              // Key on the Container that wraps the button
              key: _portfolioButtonKey,
              child: AnimatedGradientButton(
                isDarkMode: widget.isDarkMode,
                onPressed: _navigateToPortfolio,
              ),
            ),
          ),

          // About Me Button -> Circular reveal from NavBar's center
          Expanded(
            flex: 2,
            child: Center(
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

          // Social Icons
          Expanded(
            flex: 3,
            child: LayoutBuilder(
              builder: (context, constraints) {
                double iconSize = constraints.maxWidth / 5; // Adjust if needed

                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // GitHub
                    IconButton(
                      icon: FaIcon(
                        FontAwesomeIcons.github,
                        size: iconSize.clamp(12.0, 18.0),
                      ),
                      color: widget.isDarkMode
                          ? Colors.grey[800]
                          : const Color(0xFF808080),
                      onPressed: () async {
                        const url = 'https://github.com/LakshmanTurlapati';
                        if (await canLaunchUrl(Uri.parse(url))) {
                          await launchUrl(Uri.parse(url));
                        } else {
                          throw 'Could not launch $url';
                        }
                      },
                    ),
                    // LinkedIn
                    IconButton(
                      icon: FaIcon(
                        FontAwesomeIcons.linkedin,
                        size: iconSize.clamp(12.0, 18.0),
                      ),
                      color: widget.isDarkMode
                          ? Colors.grey[800]
                          : const Color(0xFF808080),
                      onPressed: () async {
                        const url =
                            'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/';
                        if (await canLaunchUrl(Uri.parse(url))) {
                          await launchUrl(Uri.parse(url));
                        } else {
                          throw 'Could not launch $url';
                        }
                      },
                    ),
                    // Twitter
                    IconButton(
                      icon: FaIcon(
                        FontAwesomeIcons.xTwitter,
                        size: iconSize.clamp(12.0, 18.0),
                      ),
                      color: widget.isDarkMode
                          ? Colors.grey[800]
                          : const Color(0xFF808080),
                      onPressed: () async {
                        const url = 'https://x.com/parzival1213';
                        if (await canLaunchUrl(Uri.parse(url))) {
                          await launchUrl(Uri.parse(url));
                        } else {
                          throw 'Could not launch $url';
                        }
                      },
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}