import 'dart:async';
import 'package:flutter/material.dart';

class SpotlightEffect extends StatefulWidget {
  final Widget child;
  final bool isDarkMode;

  const SpotlightEffect({
    Key? key,
    required this.child,
    required this.isDarkMode,
  }) : super(key: key);

  @override
  
  _SpotlightEffectState createState() => _SpotlightEffectState();
}

class _SpotlightEffectState extends State<SpotlightEffect> {
  Offset? _currentCursorPosition; 
  Offset? _targetCursorPosition; 
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 20), (timer) {
      if (_targetCursorPosition != null) {
        setState(() {
          _currentCursorPosition = Offset.lerp(
            _currentCursorPosition,
            _targetCursorPosition,
            0.2, 
          );
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onHover: (event) {
        _targetCursorPosition = event.localPosition;
      },
      onExit: (_) {
        setState(() {
          _targetCursorPosition = null;
          _currentCursorPosition = null;
        });
      },
      child: Stack(
        children: [
          widget.child,
          if (_currentCursorPosition != null)
            IgnorePointer(
              child: CustomPaint(
                painter: SpotlightPainter(
                  cursorPosition: _currentCursorPosition!,
                  isDarkMode: widget.isDarkMode,
                ),
                size: Size.infinite,
              ),
            ),
        ],
      ),
    );
  }
}

class SpotlightPainter extends CustomPainter {
  final Offset cursorPosition;
  final bool isDarkMode;

  SpotlightPainter({
    required this.cursorPosition,
    required this.isDarkMode,
  });

  @override
  void paint(Canvas canvas, Size size) {
    Paint gradientPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          isDarkMode
              ? Colors.black.withOpacity(0.075) 
              : Colors.white.withOpacity(0.1),
          Colors.transparent, // Fully fades out
        ],
        stops: [0.0, 1.0],
        radius: 1.0,
      ).createShader(
        Rect.fromCircle(center: cursorPosition, radius: 275),
      )
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 100); 

    canvas.drawCircle(cursorPosition, 275, gradientPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}