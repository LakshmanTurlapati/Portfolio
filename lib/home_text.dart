import 'package:flutter/material.dart';

class ScrollingText extends StatefulWidget {
  const ScrollingText({super.key});

  @override
  _ScrollingTextState createState() => _ScrollingTextState();
}

class _ScrollingTextState extends State<ScrollingText>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  // Scrolling roles
  final List<String> roles = [
    'UI/UX Designer',
    'Product Developer',
    'Software Developer',
    'Full-Stack Developer',
    'Cloud Developer',
  ];

  // Static parts of the text
  final String staticTextStart = 'I’m an enthused';
  final String staticTextEnd = 'from Texas!';

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true); // Continuous animation
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200, // Total height of the widget
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Static text start
              Text(
                staticTextStart,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(width: 8), // Space between static text and roles

              // Animated roles
              AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  final roleIndex =
                      (_animationController.value * roles.length).floor() %
                          roles.length;
                  return Text(
                    roles[roleIndex],
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  );
                },
              ),

              const SizedBox(width: 8), // Space between roles and static text end

              // Static text end
              Text(
                staticTextEnd,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}