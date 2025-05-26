import 'dart:math' as math;
import 'dart:ui' as ui; // Import dart:ui for PictureRecorder
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rotating Circular Text',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: Scaffold(
        body: Center(
          child: RotatingCircularText(
            text1: "Click Here",
            style1: TextStyle(fontSize: 20, color: Colors.black),
            text2: "•",
            style2: TextStyle(fontSize: 30, color: Colors.black, fontWeight: FontWeight.bold),
            numberOfPairs: 4,
            radius: 120.0,
            duration: Duration(seconds: 6),
          ),
        ),
      ),
    );
  }
}

// --- Widget Definition ---
class RotatingCircularText extends StatefulWidget {
  // Parameters remain the same
   final String text1;
   final TextStyle style1;
   final String text2;
   final TextStyle style2;
   final int numberOfPairs;
   final double radius;
   final Duration duration;

   const RotatingCircularText({
     super.key,
     required this.text1,
     required this.style1,
     required this.text2,
     required this.style2,
     required this.numberOfPairs,
     required this.radius,
     this.duration = const Duration(seconds: 10),
   });

  @override
  State<RotatingCircularText> createState() => _RotatingCircularTextState();
}

// --- Widget State ---
class _RotatingCircularTextState extends State<RotatingCircularText>
    with SingleTickerProviderStateMixin {
  // State remains largely the same
  late AnimationController _controller;
  late _CircularTextPainter _painter;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
    _updatePainter();
  }

  @override
  void didUpdateWidget(RotatingCircularText oldWidget) {
    super.didUpdateWidget(oldWidget);
     if (oldWidget.text1 != widget.text1 ||
         oldWidget.style1 != widget.style1 ||
         oldWidget.text2 != widget.text2 ||
         oldWidget.style2 != widget.style2 ||
         oldWidget.numberOfPairs != widget.numberOfPairs ||
         oldWidget.radius != widget.radius) {
       _updatePainter(); // Recreate painter which triggers Picture regeneration
     }
     if (oldWidget.duration != widget.duration) {
       _controller.duration = widget.duration;
       if (_controller.isAnimating) {
         _controller.repeat();
       }
     }
  }

   void _updatePainter() {
     _painter = _CircularTextPainter(
       text1: widget.text1,
       style1: widget.style1,
       text2: widget.text2,
       style2: widget.style2,
       numberOfPairs: widget.numberOfPairs,
       radius: widget.radius,
     );
   }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Build method remains the same
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.rotate(
            angle: _controller.value * 2 * math.pi,
            child: CustomPaint(
              size: Size(widget.radius * 2, widget.radius * 2),
              painter: _painter, // Use the painter instance
            ),
          );
        },
      ),
    );
  }
}

// --- Custom Painter ---
class _CircularTextPainter extends CustomPainter {
  // Properties remain the same
  final String text1;
  final TextStyle style1;
  final String text2;
  final TextStyle style2;
  final int numberOfPairs;
  final double radius;

  // Pre-calculated data remains the same
  final List<TextPainter> _charPainters1 = [];
  final List<double> _charAngles1 = [];
  double _totalAngle1 = 0;
  late final TextPainter _painter2;
  double _angle2 = 0;
  double _spacingPerGap = 0;

  // --- Caching ---
  ui.Picture? _cachedPicture;
  // -------------

  _CircularTextPainter({
    required this.text1,
    required this.style1,
    required this.text2,
    required this.style2,
    required this.numberOfPairs,
    required this.radius,
  }) {
    // Preparation logic now includes generating the Picture
    _preparePaintersAndPicture();
  }

  void _preparePaintersAndPicture() {
    // 1. Prepare TextPainters and calculate angles/spacing (same as before)
     _charPainters1.clear();
     _charAngles1.clear();
     _totalAngle1 = 0;
     _angle2 = 0;
     _spacingPerGap = 0;

     if (radius <= 0 || numberOfPairs <= 0) return;

     for (int i = 0; i < text1.length; i++) {
       final char = text1[i];
       final textSpan = TextSpan(text: char, style: style1);
       final textPainter = TextPainter(
           text: textSpan, textAlign: TextAlign.center, textDirection: TextDirection.ltr);
       textPainter.layout();
       _charPainters1.add(textPainter);
       final double charAngle = textPainter.width / radius;
       _charAngles1.add(charAngle);
       _totalAngle1 += charAngle;
     }

     final textSpan2 = TextSpan(text: text2, style: style2);
     _painter2 = TextPainter(
         text: textSpan2, textAlign: TextAlign.center, textDirection: TextDirection.ltr);
     _painter2.layout();
     _angle2 = _painter2.width / radius;


     final int totalSegments = numberOfPairs * 2;
     if (totalSegments <= 0) return;

     final double totalTextAngle = (_totalAngle1 * numberOfPairs) + (_angle2 * numberOfPairs);
     final double totalSpacingAvailable = (2 * math.pi) - totalTextAngle;
     _spacingPerGap = math.max(0, totalSpacingAvailable / totalSegments);

     // --- 2. Record Drawing to Picture ---
     final ui.PictureRecorder recorder = ui.PictureRecorder();
     // Create a canvas for the recorder. The picture's coordinate system starts at (0,0).
     // We need a size large enough to hold the circle.
     final Size pictureSize = Size(radius * 2, radius * 2);
     final Canvas recordingCanvas = Canvas(recorder, Rect.fromLTWH(0.0, 0.0, pictureSize.width, pictureSize.height));

     // The center for drawing calculations within the recording canvas
     final Offset center = Offset(radius, radius);
     double currentAngle = 0.0;

     if (_charPainters1.isNotEmpty || _painter2.text?.toPlainText().isNotEmpty == true) {
        // Perform the drawing logic exactly as it was in the old paint method,
        // but draw onto 'recordingCanvas' using the calculated 'center'.
        for (int p = 0; p < numberOfPairs; p++) {
           currentAngle += _spacingPerGap;
           for (int i = 0; i < _charPainters1.length; i++) {
             final textPainter = _charPainters1[i];
             final double charAngle = _charAngles1[i];
             if (charAngle <= 0 && textPainter.width <= 0) continue;
             final double drawAngle = currentAngle + charAngle / 2.0;
             final double x = center.dx + radius * math.cos(drawAngle); // Use center.dx
             final double y = center.dy + radius * math.sin(drawAngle); // Use center.dy

             recordingCanvas.save();
             recordingCanvas.translate(x, y);
             recordingCanvas.rotate(drawAngle + math.pi / 2.0);
             recordingCanvas.translate(-textPainter.width / 2.0, -textPainter.height / 2.0);
             textPainter.paint(recordingCanvas, Offset.zero);
             recordingCanvas.restore();
             currentAngle += charAngle;
           }

           currentAngle += _spacingPerGap;
           if (_angle2 > 0 || _painter2.width > 0) {
             final double drawAngle = currentAngle + _angle2 / 2.0;
             final double x = center.dx + radius * math.cos(drawAngle); // Use center.dx
             final double y = center.dy + radius * math.sin(drawAngle); // Use center.dy

             recordingCanvas.save();
             recordingCanvas.translate(x, y);
             recordingCanvas.rotate(drawAngle + math.pi / 2.0);
             recordingCanvas.translate(-_painter2.width / 2.0, -_painter2.height / 2.0);
             _painter2.paint(recordingCanvas, Offset.zero);
             recordingCanvas.restore();
             currentAngle += _angle2;
           }
        }
     }
     // Finish recording
     _cachedPicture = recorder.endRecording();
     // ------------------------------------
  }

  @override
  void paint(Canvas canvas, Size size) {
    // --- Performance: Draw the cached picture ---
    if (_cachedPicture != null) {
       // The origin for drawing the picture should be (0,0) within the CustomPaint's area.
       // The picture itself was recorded relative to its own top-left origin.
      canvas.drawPicture(_cachedPicture!);
    }
    // No more complex drawing loops here!
    // ------------------------------------------
  }

  @override
  bool shouldRepaint(covariant _CircularTextPainter oldDelegate) {
    // Repainting the *same* painter instance doesn't require redrawing if picture is cached.
    // However, if the properties change, a *new* painter instance is created by the state's
    // didUpdateWidget, which correctly regenerates the picture.
    // So, this check is less critical but good practice.
     return oldDelegate.text1 != text1 ||
            oldDelegate.style1 != style1 ||
            oldDelegate.text2 != text2 ||
            oldDelegate.style2 != style2 ||
            oldDelegate.numberOfPairs != numberOfPairs ||
            oldDelegate.radius != radius;
  }
}