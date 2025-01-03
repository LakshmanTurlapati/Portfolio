import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'mobile_portfolio_button.dart';
import 'package:url_launcher/url_launcher.dart';

class NavBar extends StatelessWidget {
  final bool isDarkMode;

  const NavBar({super.key, required this.isDarkMode});

  @override
  Widget build(BuildContext context) {
    // Get the screen width
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      width: screenWidth * 0.9, // Use 90% of the screen width
      height: 70,
      decoration: BoxDecoration(
        color: isDarkMode
            ? Colors.white.withOpacity(0.8)
            : Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(25),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Portfolio Button
          Expanded(
            flex: 2,
            child: AnimatedGradientButton(isDarkMode: isDarkMode),
          ),

          // About Me Text
          Expanded(
            flex: 2,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  print('About Me clicked');
                },
                child: Text(
                  'About Me',
                  style: TextStyle(
                    color: isDarkMode
                        ? Colors.grey[800]
                        : Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ),

          // Social Icons with Flex 2
          Expanded(
            flex: 3,
            child: LayoutBuilder(
              builder: (context, constraints) {
                // Calculate icon size based on available space
                double iconSize = constraints.maxWidth / 5; // Adjust divider as needed

                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // GitHub Icon
                    IconButton(
                      icon: FaIcon(
                        FontAwesomeIcons.github,
                        size: iconSize.clamp(12.0, 18.0), // Restrict size between 12 and 18
                      ),
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

                    // LinkedIn Icon
                    IconButton(
                      icon: FaIcon(
                        FontAwesomeIcons.linkedin,
                        size: iconSize.clamp(12.0, 18.0), // Restrict size between 12 and 18
                      ),
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

                    // Twitter Icon
                    IconButton(
                      icon: FaIcon(
                        FontAwesomeIcons.twitter,
                        size: iconSize.clamp(12.0, 18.0), // Restrict size between 12 and 18
                      ),
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
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}