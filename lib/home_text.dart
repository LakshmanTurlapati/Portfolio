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
    'AI Developer',
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
                
                Text(
                  staticTextStart,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.normal,
                    color: widget.isDarkMode ? Colors.white : Colors.black, 
                  ),
                ),
                const SizedBox(width: 12),

                SizedBox(
                  height: 150, 
                  width: 230, 
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
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: widget.isDarkMode
                                  ? Colors.white
                                  : Colors.black, 
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),

               
                Text(
                  staticTextEnd,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.normal,
                    color: widget.isDarkMode ? Colors.white : Colors.black, 
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