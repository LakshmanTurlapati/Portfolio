import 'package:flutter/material.dart';
import 'dart:math';

class AnimatedGradientButton extends StatefulWidget {
  @override
  _AnimatedGradientButtonState createState() => _AnimatedGradientButtonState();
}

class _AnimatedGradientButtonState extends State<AnimatedGradientButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          alignment: Alignment.center,
          children: [
            // Glowing Gradient Background
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Container(
                  width: constraints.maxWidth,
                  height: constraints.maxHeight,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color.lerp(Colors.purple, Colors.cyan,
                            sin(_controller.value * pi))!,
                        Color.lerp(Colors.cyan, Colors.blue,
                            cos(_controller.value * pi))!,
                        Color.lerp(Colors.blue, Colors.purple,
                            sin(_controller.value * pi))!,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(25),
                  ),
                );
              },
            ),
            // Button in the foreground
            ElevatedButton(
              onPressed: () {
                print('Portfolio clicked');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white, // Add a distinct background
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20), // Slightly smaller radius
                  side: BorderSide(color: Colors.black.withOpacity(0), width: 0), // Add border
                ),
                shadowColor: Colors.transparent,
                elevation: 5,
                padding: EdgeInsets.zero,
              ),
              child: Container(
                alignment: Alignment.center,
                constraints: BoxConstraints(
                  maxWidth: constraints.maxWidth * 0.95, // Slightly smaller than gradient
                  maxHeight: constraints.maxHeight * 0.8, // Slightly smaller than gradient
                ),
                child: const Text(
                  'Portfolio',
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}