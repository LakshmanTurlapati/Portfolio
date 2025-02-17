// portfolio_button.dart
import 'package:flutter/material.dart';
import 'dart:math';

class AnimatedGradientButton extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback onPressed; // Added onPressed callback

  const AnimatedGradientButton({
    Key? key,
    required this.isDarkMode,
    required this.onPressed, // Require onPressed in constructor
  }) : super(key: key);

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
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      return Stack(
        alignment: Alignment.center,
        children: [
          // Animated Gradient Background
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              final t = _controller.value * 2 * pi;

              const color1 = Color(0xFF002BFF);
              const color2 = Color(0xFF00FFCC);
              const color3 = Color(0xFFFF4AD5);

              const double radius = 4.0;

              final offset1 = Offset(radius * cos(t), radius * sin(t));
              final offset2 = Offset(
                radius * cos(t + 2 * pi / 3),
                radius * sin(t + 2 * pi / 3),
              );
              final offset3 = Offset(
                radius * cos(t + 4 * pi / 3),
                radius * sin(t + 4 * pi / 3),
              );

              return Container(
                width: constraints.maxWidth,
                height: constraints.maxHeight,
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: color1.withOpacity(0.4),
                      blurRadius: 18,
                      spreadRadius: 1,
                      offset: offset1,
                    ),
                    BoxShadow(
                      color: color2.withOpacity(0.4),
                      blurRadius: 18,
                      spreadRadius: 1,
                      offset: offset2,
                    ),
                    BoxShadow(
                      color: color3.withOpacity(0.4),
                      blurRadius: 18,
                      spreadRadius: 1,
                      offset: offset3,
                    ),
                  ],
                ),
              );
            },
          ),
          // Elevated Button
          ElevatedButton(
            onPressed: widget.onPressed, // Use the passed callback
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  widget.isDarkMode ? Colors.black : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide.none,
              ),
              shadowColor: Colors.transparent,
              elevation: 5,
              padding: EdgeInsets.zero,
            ),
            child: Container(
              alignment: Alignment.center,
              constraints: BoxConstraints(
                maxWidth: constraints.maxWidth * 0.95,
                maxHeight: constraints.maxHeight * 0.8,
              ),
              child: Text(
                'Portfolio',
                style: TextStyle(
                  color:
                      widget.isDarkMode ? Colors.white : Colors.black,
                  fontWeight: FontWeight.w600,
                  fontSize: 18,
                ),
              ),
            ),
          ),
        ],
      );
    });
  }
}