import 'package:flutter/material.dart';
import 'dart:math';

class ThemeToggle extends StatefulWidget {
  final VoidCallback toggleTheme;
  final bool isDarkMode;

  const ThemeToggle({
    super.key,
    required this.toggleTheme,
    required this.isDarkMode,
  });

  @override
  _ThemeToggleState createState() => _ThemeToggleState();
}

class _ThemeToggleState extends State<ThemeToggle>
    with TickerProviderStateMixin {
  bool isSunHovered = false;
  bool isMoonHovered = false;

  late AnimationController _sunController;
  late AnimationController _moonController;
  late Animation<double> _rayAnimation;
  late Animation<double> _moonRotation;
  late Animation<double> _moonSize;

  @override
  void initState() {
    super.initState();

    // Sun Animation
    _sunController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _rayAnimation = Tween<double>(begin: 4.0, end: 6.0).animate(CurvedAnimation(
      parent: _sunController,
      curve: Curves.easeInOut,
    ));

    // Moon Animation
    _moonController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _moonRotation = Tween<double>(begin: -0.523599, end: -0.523599) // -30° to 0°
        .animate(CurvedAnimation(
      parent: _moonController,
      curve: Curves.easeInOut,
    ));

    _moonSize = Tween<double>(begin: 24.0, end: 26.0) // 24px to 26px
        .animate(CurvedAnimation(
      parent: _moonController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _sunController.dispose();
    _moonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Sun
        MouseRegion(
          onEnter: (_) {
            setState(() {
              isSunHovered = true;
              _sunController.forward();
            });
          },
          onExit: (_) {
            setState(() {
              isSunHovered = false;
              _sunController.reverse();
            });
          },
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: () {
              if (widget.isDarkMode) {
                widget.toggleTheme(); // Change to light mode
              }
            },
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _rayAnimation,
                  builder: (context, child) {
                    return CustomPaint(
                      size: const Size(30, 30),
                      painter: SunCirclePainter(rayLength: _rayAnimation.value),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: DashedLine(
            height: 22,
            dashWidth: 1,
            dashHeight: 3,
            color: Colors.black26,
          ),
        ),
        // Moon
        MouseRegion(
          onEnter: (_) {
            setState(() {
              isMoonHovered = true;
              _moonController.forward();
            });
          },
          onExit: (_) {
            setState(() {
              isMoonHovered = false;
              _moonController.reverse();
            });
          },
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: () {
              if (!widget.isDarkMode) {
                widget.toggleTheme(); // Change to dark mode
              }
            },
            child: AnimatedBuilder(
              animation: _moonController,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _moonRotation.value,
                  child: Icon(
                    Icons.nightlight_round,
                    size: _moonSize.value,
                    color: widget.isDarkMode ? Colors.yellow : Colors.black26,
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class SunCirclePainter extends CustomPainter {
  final double rayLength;

  SunCirclePainter({required this.rayLength});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    // Center of the sun (circle)
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 6;

    // Draw the black circle as a stroke
    canvas.drawCircle(center, radius, paint);

    // Rays paint
    final rayPaint = Paint()
      ..color = Colors.black
      ..strokeWidth = 2;

    // Gap between the circle and rays
    final gap = 4;

    // Draw rays
    for (int i = 0; i < 8; i++) {
      final angle = (i * 45) * (pi / 180);
      final startX = center.dx + (radius + gap) * cos(angle);
      final startY = center.dy + (radius + gap) * sin(angle);
      final endX = center.dx + (radius + gap + rayLength) * cos(angle);
      final endY = center.dy + (radius + gap + rayLength) * sin(angle);

      canvas.drawLine(Offset(startX, startY), Offset(endX, endY), rayPaint);
    }
  }

  @override
  bool shouldRepaint(covariant SunCirclePainter oldDelegate) {
    return oldDelegate.rayLength != rayLength;
  }
}

class DashedLine extends StatelessWidget {
  final double height;
  final double dashWidth;
  final double dashHeight;
  final Color color;

  const DashedLine({
    super.key,
    this.height = 24,
    this.dashWidth = 1,
    this.dashHeight = 4,
    this.color = Colors.black26,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: CustomPaint(
        painter: DashedLinePainter(
          dashWidth: dashWidth,
          dashHeight: dashHeight,
          color: color,
        ),
      ),
    );
  }
}

class DashedLinePainter extends CustomPainter {
  final double dashWidth;
  final double dashHeight;
  final Color color;

  DashedLinePainter({
    required this.dashWidth,
    required this.dashHeight,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = dashWidth;

    double startY = 1;
    while (startY < size.height) {
      canvas.drawLine(
        Offset(0, startY),
        Offset(0, startY + dashHeight),
        paint,
      );
      startY += dashHeight * 2;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}