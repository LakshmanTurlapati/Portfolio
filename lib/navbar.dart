import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'portfolio_button.dart';
import 'package:url_launcher/url_launcher.dart';

class NavBar extends StatelessWidget {
  final bool isDarkMode; // Add isDarkMode parameter

  const NavBar({super.key, required this.isDarkMode});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 630,
      height: 60,
      decoration: BoxDecoration(
        color: isDarkMode
            ? Colors.white.withOpacity(0.8) // White with 80% opacity in dark mode
            : Colors.black.withOpacity(0.8), // Black with 80% opacity otherwise
        borderRadius: BorderRadius.circular(25),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Flexible(
            flex: 1,
            child: AnimatedGradientButton(isDarkMode: isDarkMode),
          ),
          Flexible(
            flex: 1,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  print('About Me clicked');
                },
                child: Text(
                  'About Me',
                  style: TextStyle(
                    color: isDarkMode
                        ? Colors.grey[800] // Dark grey text in dark mode
                        : Colors.grey, // Default grey text otherwise
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ),
          Flexible(
            flex: 1,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.github), 
                  color: isDarkMode
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
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.linkedin), 
                  color: isDarkMode
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
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.twitter), 
                  color: isDarkMode
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
            ),
          ),
        ],
      ),
    );
  }
}