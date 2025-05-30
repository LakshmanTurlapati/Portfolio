import 'package:flutter/material.dart';
import 'dart:math';

class AnimatedGradientButton extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback? onPressed; // Allow an external callback

  const AnimatedGradientButton({
    Key? key,
    required this.isDarkMode,
    this.onPressed, // optional or required, your choice
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
    )..repeat(); // continuously loops
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
          // Gradient Animation Background
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

          // Button with Image
          ElevatedButton(
            // Use the passed callback if provided, else default
            onPressed: widget.onPressed ?? () => print('Portfolio clicked'),
            style: ElevatedButton.styleFrom(
              backgroundColor: widget.isDarkMode ? Colors.black : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              shadowColor: Colors.transparent,
              elevation: 5,
              padding: EdgeInsets.zero,
            ),
            child: Container(
              alignment: Alignment.center,
              constraints: BoxConstraints(
                maxWidth: constraints.maxWidth * 0.9,
                maxHeight: constraints.maxHeight * 0.8,
              ),
             child: Transform.scale(
    scale: 1.4, // Increase the scale (1.0 is default, 1.2 increases size by 20%)
    child: Image.asset(
      widget.isDarkMode
          ? 'web/icons/portfolio_light.png'
          : 'web/icons/portfolio.png',
      fit: BoxFit.scaleDown,),
              ),
            ),
          ),
        ],
      );
    });
  }
}