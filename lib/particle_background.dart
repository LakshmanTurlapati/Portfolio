import 'package:flutter/material.dart';
import 'dart:math';

class AnimatedCircleBackground extends StatefulWidget {
  const AnimatedCircleBackground({Key? key}) : super(key: key);

  @override
  State<AnimatedCircleBackground> createState() =>
      _AnimatedCircleBackgroundState();
}

class _AnimatedCircleBackgroundState extends State<AnimatedCircleBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final Random _random = Random();

  final int numberOfCircles = 7;
  late List<Offset> circlePositions;
  late List<Offset> circleVelocities;
  late List<double> circleSizes;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 60), 
    )..repeat();

    circlePositions = List.generate(
      numberOfCircles,
      (index) => Offset(
        _random.nextDouble() * 500, 
        _random.nextDouble() * 800, 
      ),
    );

    circleVelocities = List.generate(
      numberOfCircles,
      (index) => Offset(
        _random.nextDouble() * 2 - 1, 
        _random.nextDouble() * 2 - 1, 
      ),
    );

    circleSizes = List.generate(
      numberOfCircles,
      (index) => 80 + _random.nextDouble() * 100, 
    );
  }

  void _updateCirclePositions(Size size) {
    for (int i = 0; i < numberOfCircles; i++) {
      final newPosition = circlePositions[i] + circleVelocities[i];

      if (newPosition.dx + circleSizes[i] < 0 ||
          newPosition.dy + circleSizes[i] < 0 ||
          newPosition.dx - circleSizes[i] > size.width ||
          newPosition.dy - circleSizes[i] > size.height) {
        circlePositions[i] = Offset(
          _random.nextBool() ? -circleSizes[i] : size.width + circleSizes[i],
          _random.nextDouble() * size.height,
        );
        circleVelocities[i] = Offset(
          _random.nextDouble() * 2 - 1, 
          _random.nextDouble() * 2 - 1, 
        );
      } else {
        circlePositions[i] = newPosition;
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        _updateCirclePositions(MediaQuery.of(context).size);
        return CustomPaint(
          size: MediaQuery.of(context).size,
          painter: FloatingCirclePainter(
            circlePositions: circlePositions,
            circleSizes: circleSizes,
          ),
        );
      },
    );
  }
}

class FloatingCirclePainter extends CustomPainter {
  final List<Offset> circlePositions;
  final List<double> circleSizes;

  FloatingCirclePainter({
    required this.circlePositions,
    required this.circleSizes,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (int i = 0; i < circlePositions.length; i++) {
      final Paint paint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0xFFA8A8A8).withOpacity(0.6),
            const Color(0xFF8C8C8C).withOpacity(0.3),
            Colors.transparent,
          ],
          stops: [0.0, 0.7, 1.0],
        ).createShader(Rect.fromCircle(
          center: circlePositions[i],
          radius: circleSizes[i],
        ))
        ..maskFilter = MaskFilter.blur(
          BlurStyle.normal,
          circleSizes[i] / 8, 
        )
        ..style = PaintingStyle.fill;

      
      canvas.drawCircle(circlePositions[i], circleSizes[i], paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}