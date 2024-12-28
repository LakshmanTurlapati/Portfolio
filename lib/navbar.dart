import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart'; // Import Font Awesome
import 'portfolio_button.dart';

class NavBar extends StatelessWidget {
  const NavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 730, // Adjusted width to fit content
      height: 60, // Height of the nav bar
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8), // 80% black
        borderRadius: BorderRadius.circular(25), // Rounded corners
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween, // Space between sections
        crossAxisAlignment: CrossAxisAlignment.center, // Center content vertically
        children: [
          // Portfolio Button
          Flexible(
            flex: 1,
            child: AnimatedGradientButton(), // Ensure the button respects parent constraints
          ),

          // About Me Text
          Flexible(
            flex: 1,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  print('About Me clicked');
                },
                child: const Text(
                  'About me',
                  style: TextStyle(
                    color: Colors.grey, // Lighter text for inactive
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),

          // Social Icons
          Flexible(
            flex: 1,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.github), // GitHub icon
                  color: const Color(0xFF808080),
                  onPressed: () {
                    print('GitHub clicked');
                  },
                ),
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.linkedin), // LinkedIn icon
                  color: const Color(0xFF808080),
                  onPressed: () {
                    print('LinkedIn clicked');
                  },
                ),
                IconButton(
                  icon: const FaIcon(FontAwesomeIcons.twitter), // Twitter icon
                  color: const Color(0xFF808080),
                  onPressed: () {
                    print('Twitter clicked');
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