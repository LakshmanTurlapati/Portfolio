import 'dart:async';
import 'package:flutter/material.dart';

class ScrollingText extends StatefulWidget {
  final bool isDarkMode;

  const ScrollingText({super.key, this.isDarkMode = false});

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

  late FixedExtentScrollController _scrollController;
  late Timer _timer;

  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _scrollController = FixedExtentScrollController(initialItem: 0);

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
    return Row(
      children: [
        // Rotated Static Text on the Left
        Padding(
          padding: const EdgeInsets.only(left: 20), // 20px left margin
          child: RotatedBox(
            quarterTurns: 3, // Rotate 90 degrees counter-clockwise
            child: Text.rich(
              TextSpan(
                children: [
                  const TextSpan(
                    text: 'What ',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.normal,
                    ),
                  ),
                  const TextSpan(
                    text: 'Defines',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold, // Bold style for "Defines"
                    ),
                  ),
                  const TextSpan(
                    text: ' me?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.normal,
                    ),
                  ),
                ],
              ),
              style: TextStyle(
                color: widget.isDarkMode ? Colors.white : Colors.black,
              ),
            ),
          ),
        ),

        // Expand to Fill Space Dynamically
        Expanded(
          child: Container(), // Empty container to take up dynamic space
        ),

        // Scrolling Text on the Right Edge
        Padding(
          padding: const EdgeInsets.only(right: 20), // 20px right margin
          child: SizedBox(
            height: 150,
            width: 230, // Fixed width for scrolling text
            child: ShaderMask(
              shaderCallback: (Rect bounds) {
                return const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black,
                    Colors.transparent,
                  ],
                  stops: [0.0, 0.5, 1.0],
                ).createShader(bounds);
              },
              blendMode: BlendMode.dstIn,
              child: ListWheelScrollView.useDelegate(
                controller: _scrollController,
                physics: const FixedExtentScrollPhysics(),
                perspective: 0.003,
                itemExtent: 30,
                childDelegate: ListWheelChildLoopingListDelegate(
                  children: roles.map((role) {
                    return Text(
                      role,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: widget.isDarkMode ? Colors.white : Colors.black,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}