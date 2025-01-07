// circular_reveal_page_route.dart
import 'package:flutter/material.dart';
import 'dart:math';

/// from a given [startOffset] and initial radius [startRadius].
/// As [animation] goes from 0 -> 1, we expand the circle to fill the screen.
class CircularRevealPageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;
  final Offset startOffset;
  final double startRadius;
  final Duration duration;
  final Duration reverseDuration;

  CircularRevealPageRoute({
    required this.page,
    required this.startOffset,
    this.startRadius = 0,
    this.duration = const Duration(milliseconds: 500),
    this.reverseDuration = const Duration(milliseconds: 500),
  }) : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: duration,
          reverseTransitionDuration: reverseDuration,
        );

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return AnimatedBuilder(
      animation: animation,
      builder: (ctx, ch) {
        final t = animation.value;

        // The max radius needed to cover the entire screen from startOffset
        final screenSize = MediaQuery.of(context).size;
        final maxX = max(startOffset.dx, screenSize.width - startOffset.dx);
        final maxY = max(startOffset.dy, screenSize.height - startOffset.dy);
        final maxRadius = sqrt(maxX * maxX + maxY * maxY);

        // Our current radius goes from startRadius -> maxRadius
        final currentRadius = startRadius + (maxRadius - startRadius) * t;

        return Stack(
          children: [
            // The 'clip' layer
            ClipPath(
              clipper: _CircularRevealClipper(
                center: startOffset,
                radius: currentRadius,
              ),
              child: ch,
            ),
          ],
        );
      },
      child: child,
    );
  }
}

class _CircularRevealClipper extends CustomClipper<Path> {
  final Offset center;
  final double radius;

  _CircularRevealClipper({required this.center, required this.radius});

  @override
  Path getClip(Size size) {
    return Path()..addOval(Rect.fromCircle(center: center, radius: radius));
  }

  @override
  bool shouldReclip(_CircularRevealClipper oldClipper) {
    return oldClipper.radius != radius || oldClipper.center != center;
  }
}