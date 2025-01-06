// snowfall.dart
import 'dart:math';
import 'package:flutter/material.dart';

/// A widget that provides a dynamic snowfall background with three layers of depth.
/// It wraps around the [child] widget, displaying snowfall beneath it.
/// The snowfall direction is influenced by the mouse movement.
class SnowfallEffect extends StatefulWidget {
  /// Indicates whether dark mode is enabled. Adjusts snowfall colors accordingly.
  final bool isDarkMode;

  /// The child widget to display above the snowfall background.
  final Widget child;

  /// Creates a [SnowfallEffect] widget.
  const SnowfallEffect({
    Key? key,
    required this.isDarkMode,
    required this.child,
  }) : super(key: key);

  @override
  _SnowfallEffectState createState() => _SnowfallEffectState();
}

class _SnowfallEffectState extends State<SnowfallEffect> {
  // Drift factor ranging from -1 (left) to 1 (right)
  double _driftFactor = 0.0;

  void _updateDrift(PointerEvent details) {
    final size = MediaQuery.of(context).size;
    final mouseX = details.position.dx;

    // Calculate drift factor based on mouse X position relative to screen center
    // Normalize to range between -1 and 1
    final centerX = size.width / 2;
    final maxDrift = 1.0; // Maximum drift factor
    _driftFactor = ((mouseX - centerX) / centerX).clamp(-1.0, 1.0) * maxDrift;

    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onHover: _updateDrift,
      child: Stack(
        children: [
          // Snowfall Background
          SnowfallBackground(
            isDarkMode: widget.isDarkMode,
            driftFactor: _driftFactor,
          ),
          // Child Content
          widget.child,
        ],
      ),
    );
  }
}

/// A widget that combines multiple snowfall layers to create a depth effect.
/// The snowfall direction is influenced by [driftFactor].
class SnowfallBackground extends StatelessWidget {
  /// Indicates whether dark mode is enabled. Adjusts snowfall colors accordingly.
  final bool isDarkMode;

  /// The drift factor influencing the horizontal movement of snowflakes.
  /// Ranges from -1 (left) to 1 (right).
  final double driftFactor;

  /// Creates a [SnowfallBackground] widget.
  const SnowfallBackground({
    Key? key,
    required this.isDarkMode,
    required this.driftFactor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Define snowflake colors based on dark mode
    final Color snowflakeColor = isDarkMode ? Colors.black : Colors.white;

    // Define opacity variations for depth effect
    final Color backLayerColor = snowflakeColor.withOpacity(0.7);
    final Color middleLayerColor = snowflakeColor.withOpacity(0.5);
    final Color frontLayerColor = snowflakeColor.withOpacity(0.3);

    return Stack(
      children: [
        // Back Layer - Slowest and largest snowflakes with more blur
        SnowfallLayer(
          numberOfSnowflakes: 50,
          minSpeed: 0.5,
          maxSpeed: 1.0,
          minSize: 2.0,
          maxSize: 4.0,
          color: backLayerColor,
          driftFactor: driftFactor,
          blurSigma: 2.0, // Increased blur for depth
        ),
        // Middle Layer - Medium speed and size with moderate blur
        SnowfallLayer(
          numberOfSnowflakes: 70,
          minSpeed: 0.5,
          maxSpeed: 1.5,
          minSize: 0.5,
          maxSize: 3.0,
          color: middleLayerColor,
          driftFactor: driftFactor,
          blurSigma: 0.1, // Moderate blur
        ),
        // Front Layer - Fastest and smallest snowflakes with slight blur
        SnowfallLayer(
          numberOfSnowflakes: 100,
          minSpeed: 2.0,
          maxSpeed: 3.0,
          minSize: 1.0,
          maxSize: 2.0,
          color: frontLayerColor,
          driftFactor: driftFactor,
          blurSigma: 1.0, // Slight blur
        ),
      ],
    );
  }
}

/// A stateful widget representing a single layer of snowfall.
class SnowfallLayer extends StatefulWidget {
  /// Number of snowflakes in this layer.
  final int numberOfSnowflakes;

  /// Minimum falling speed of snowflakes.
  final double minSpeed;

  /// Maximum falling speed of snowflakes.
  final double maxSpeed;

  /// Minimum size (radius) of snowflakes.
  final double minSize;

  /// Maximum size (radius) of snowflakes.
  final double maxSize;

  /// Color of the snowflakes.
  final Color color;

  /// Drift factor influencing the horizontal movement of snowflakes.
  final double driftFactor;

  /// Gaussian blur sigma to apply to snowflakes.
  final double blurSigma;

  /// Creates a [SnowfallLayer] widget.
  const SnowfallLayer({
    Key? key,
    required this.numberOfSnowflakes,
    required this.minSpeed,
    required this.maxSpeed,
    required this.minSize,
    required this.maxSize,
    required this.color,
    required this.driftFactor,
    this.blurSigma = 1.0,
  }) : super(key: key);

  @override
  _SnowfallLayerState createState() => _SnowfallLayerState();
}

class _SnowfallLayerState extends State<SnowfallLayer>
    with SingleTickerProviderStateMixin {
  late List<Snowflake> snowflakes;
  late AnimationController _controller;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _initializeSnowflakes();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 16), // Approximately 60 FPS
    )..addListener(_updateSnowflakes);
    _controller.repeat();
  }

  /// Initializes the list of snowflakes with random properties.
  void _initializeSnowflakes() {
    snowflakes = List.generate(widget.numberOfSnowflakes, (index) {
      return Snowflake(
        x: _random.nextDouble(),
        y: _random.nextDouble(),
        speed:
            widget.minSpeed + _random.nextDouble() * (widget.maxSpeed - widget.minSpeed),
        drift: (_random.nextDouble() - 0.5) * 0.002, // Base subtle horizontal drift
        size: widget.minSize +
            _random.nextDouble() * (widget.maxSize - widget.minSize),
      );
    });
  }

  /// Updates the position of each snowflake based on its speed and drift.
  void _updateSnowflakes() {
    setState(() {
      for (var flake in snowflakes) {
        flake.y += flake.speed / 1000; // Adjusted for smoother animation

        // Adjust drift based on driftFactor
        // Normalize driftFactor to a small drift addition
        flake.x += flake.drift + (widget.driftFactor * 0.001);

        // Reset snowflake if it goes beyond the bottom
        if (flake.y > 1) {
          flake.y = -0.05;
          flake.x = _random.nextDouble();
          flake.speed =
              widget.minSpeed + _random.nextDouble() * (widget.maxSpeed - widget.minSpeed);
          flake.size =
              widget.minSize + _random.nextDouble() * (widget.maxSize - widget.minSize);
          flake.drift = (_random.nextDouble() - 0.5) * 0.002;
        }

        // Wrap around horizontally
        if (flake.x > 1) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = 1;
        }
      }
    });
  }

  @override
  void didUpdateWidget(covariant SnowfallLayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If driftFactor changes, update snowflakes' drift
    if (oldWidget.driftFactor != widget.driftFactor) {
      // Optionally, implement smooth drift adjustments here
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_updateSnowflakes);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _SnowPainter(snowflakes, widget.color, widget.blurSigma),
      child: Container(),
    );
  }
}

/// A simple model representing a single snowflake.
class Snowflake {
  /// Horizontal position (0 to 1)
  double x;

  /// Vertical position (0 to 1)
  double y;

  /// Falling speed
  double speed;

  /// Base horizontal drift
  double drift;

  /// Radius of the snowflake
  double size;

  /// Creates a [Snowflake] instance.
  Snowflake({
    required this.x,
    required this.y,
    required this.speed,
    required this.drift,
    required this.size,
  });
}

/// Custom painter to draw snowflakes on the canvas with a blur effect.
class _SnowPainter extends CustomPainter {
  final List<Snowflake> snowflakes;
  final Color color;
  final double blurSigma;

  /// Creates a [_SnowPainter].
  _SnowPainter(this.snowflakes, this.color, this.blurSigma);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, blurSigma);

    for (var flake in snowflakes) {
      final dx = flake.x * size.width;
      final dy = flake.y * size.height;
      canvas.drawCircle(Offset(dx, dy), flake.size, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SnowPainter oldDelegate) => true;
}