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
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                final animatedColor1 = Color.lerp(
                    Colors.purple, Colors.cyan, sin(_controller.value * pi))!;
                final animatedColor2 = Color.lerp(
                    Colors.cyan, Colors.blue, cos(_controller.value * pi))!;

                return Container(
                  width: constraints.maxWidth * 1, 
                  height: constraints.maxHeight * 1, 
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: [
                      BoxShadow(
                        color: animatedColor1.withOpacity(0.5), 
                        blurRadius: 20, 
                        spreadRadius: 2, 
                      ),
                      BoxShadow(
                        color: animatedColor2.withOpacity(0.4),
                        blurRadius: 30,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                );
              },
            ),
           
            ElevatedButton(
              onPressed: () {
                print('Portfolio clicked');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white, // Add a distinct background
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20), // Button shape
                  side: BorderSide(color: Colors.black.withOpacity(0), width: 0),
                ),
                shadowColor: Colors.transparent,
                elevation: 5,
                padding: EdgeInsets.zero,
              ),
              child: Container(
                alignment: Alignment.center,
                constraints: BoxConstraints(
                  maxWidth: constraints.maxWidth * 0.95, // Button size
                  maxHeight: constraints.maxHeight * 0.8,
                ),
                child: const Text(
                  'Portfolio',
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w600,
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