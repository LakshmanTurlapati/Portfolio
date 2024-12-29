import 'dart:async';
import 'package:flutter/material.dart';

class ScrollingText extends StatefulWidget {
  const ScrollingText({super.key});

  @override
  _ScrollingTextState createState() => _ScrollingTextState();
}

class _ScrollingTextState extends State<ScrollingText> {
  final List<String> roles = [
    'UI/UX Designer',
    'Product Developer',
    'Software Developer',
    'Full-Stack Developer',
    'Cloud Developer',
  ];

  final String staticTextStart = 'I’m an enthused';
  final String staticTextEnd = 'from Texas!';

  late FixedExtentScrollController _scrollController;
  late Timer _timer;

  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _scrollController = FixedExtentScrollController(initialItem: 0);

    // Timer to auto-scroll every second
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _currentIndex = (_currentIndex + 1);
        _scrollController.animateToItem(
          _currentIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Column(
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
                    fontWeight: FontWeight.normal,
                  ),
                ),
                const SizedBox(width: 12),

                // Scrolling text with 3D effect
                SizedBox(
                  height: 150, // Adjust height to fit visible area
                  width: 230, // Width for the scrolling text
                  child: ShaderMask(
                    shaderCallback: (Rect bounds) {
                      return const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent, // Fully transparent at the top
                          Colors.black, // Fully visible in the middle
                          Colors.transparent, // Fully transparent at the bottom
                        ],
                        stops: [0.0, 0.5, 1.0], // Control the gradient stops
                      ).createShader(bounds);
                    },
                    blendMode: BlendMode.dstIn,
                    child: ListWheelScrollView.useDelegate(
                      controller: _scrollController,
                      physics: const FixedExtentScrollPhysics(),
                      perspective: 0.003, // Creates the 3D effect
                      itemExtent: 30, // Height of each item
                      childDelegate: ListWheelChildLoopingListDelegate(
                        children: roles.map((role) {
                          return Text(
                            role,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Static text end
                Text(
                  staticTextEnd,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}