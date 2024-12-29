import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart'; 
import 'portfolio_button.dart'; 
import 'package:url_launcher/url_launcher.dart';


class NavBar extends StatelessWidget {
  const NavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 630, 
      height: 60, 
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8), 
        borderRadius: BorderRadius.circular(25), 
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween, 
        crossAxisAlignment: CrossAxisAlignment.center, 
        children: [
          Flexible(
            flex: 1,
            child: AnimatedGradientButton(), 
          ),

          Flexible(
            flex: 1,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  print('About Me clicked');
                },
                child: const Text(
                  'About Me',
                  style: TextStyle(
                    color: Colors.grey, 
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
                  icon: const FaIcon(FontAwesomeIcons.github), // GitHub icon
                  color: const Color(0xFF808080),
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
                  icon: const FaIcon(FontAwesomeIcons.linkedin), // LinkedIn icon
                  color: const Color(0xFF808080),
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
                  icon: const FaIcon(FontAwesomeIcons.twitter), // Twitter icon
                  color: const Color(0xFF808080),
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
