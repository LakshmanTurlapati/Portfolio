import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'portfolio_button.dart';
import 'package:url_launcher/url_launcher.dart';
import 'about_page.dart';
import 'circular_reveal_page_route.dart'; // Our custom radial route

class NavBar extends StatelessWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const NavBar({
    super.key,
    required this.isDarkMode,
    required this.toggleTheme,
  });

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
              color: isDarkMode
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
              child: AnimatedGradientButton(isDarkMode: isDarkMode),
            ),
          ),

          Positioned.fill(
            child: Center(
              child: GestureDetector(
                onTap: () {
                  final box = context.findRenderObject() as RenderBox?;
                  if (box != null) {
                    final navBarPos = box.localToGlobal(Offset.zero);
                    final centerX = navBarPos.dx + (box.size.width / 2);
                    final centerY = navBarPos.dy + (box.size.height / 2);
                    final offset = Offset(centerX, centerY);

                    Navigator.of(context).push(
                      CircularRevealPageRoute(
                        page: AboutPage(
                          isDarkMode: isDarkMode,
                          toggleTheme: toggleTheme,
                        ),
                        startOffset: offset,
                        startRadius: 0,
                        duration: const Duration(milliseconds: 500),
                        reverseDuration: const Duration(milliseconds: 500),
                      ),
                    );
                  }
                },
                child: Text(
                  'About Me',
                  style: TextStyle(
                    color: isDarkMode ? Colors.grey[800] : Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ),

          // Social icons
          Positioned(
            right: 10,
            top: 0,
            bottom: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.github),
                  color: isDarkMode ? Colors.grey[800] : const Color(0xFF808080),
                  onPressed: () async {
                    const url = 'https://github.com/LakshmanTurlapati';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url));
                    } else {
                      throw 'Could not launch $url';
                    }
                  },
                ),
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.linkedin),
                  color: isDarkMode ? Colors.grey[800] : const Color(0xFF808080),
                  onPressed: () async {
                    const url = 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url));
                    } else {
                      throw 'Could not launch $url';
                    }
                  },
                ),
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.twitter),
                  color: isDarkMode ? Colors.grey[800] : const Color(0xFF808080),
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
            ),
          ),
        ],
      ),
    );
  }
}