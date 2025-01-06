// import 'dart:async';
// import 'dart:math';
// import 'package:flutter/material.dart';

// class FoggedScreenEffect extends StatefulWidget {
//   final Widget child;
//   final bool isDarkMode;

//   const FoggedScreenEffect({
//     Key? key,
//     required this.child,
//     required this.isDarkMode,
//   }) : super(key: key);

//   @override
//   _FoggedScreenEffectState createState() => _FoggedScreenEffectState();
// }

// class _FoggedScreenEffectState extends State<FoggedScreenEffect> with SingleTickerProviderStateMixin {
//   late AnimationController _animationController;
//   List<FogParticle> _particles = [];
//   final Random _random = Random();

//   @override
//   void initState() {
//     super.initState();
//     _animationController = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 16),
//     )..addListener(() {
//         setState(() {
//           final size = MediaQuery.of(context).size;
//           _updateParticles(size);
//         });
//       });

//     _animationController.repeat();
//   }

//   @override
//   void didChangeDependencies() {
//     super.didChangeDependencies();
//     final size = MediaQuery.of(context).size;
//     _generateParticles(size);
//   }

//   @override
//   void dispose() {
//     _animationController.dispose();
//     super.dispose();
//   }

//   void _generateParticles(Size size) {
//     for (int i = 0; i < 2000; i++) {
//       _particles.add(FogParticle(
//         position: Offset(_random.nextDouble() * size.width, _random.nextDouble() * size.height),
//         velocity: Offset((_random.nextDouble() - 0.5) * 2, (_random.nextDouble() - 0.5) * 2),
//         radius:   1,
//         opacity: _random.nextDouble() * 0.5 + 0.3,
//       ));
//     }
//   }

//   void _updateParticles(Size size) {
//     for (var particle in _particles) {
//       particle.position += particle.velocity;

//       // Bounce particles off the screen edges
//       if (particle.position.dx <= 0 || particle.position.dx >= size.width) {
//         particle.velocity = Offset(-particle.velocity.dx, particle.velocity.dy);
//       }
//       if (particle.position.dy <= 0 || particle.position.dy >= size.height) {
//         particle.velocity = Offset(particle.velocity.dx, -particle.velocity.dy);
//       }
//     }
//   }

//   void _handleTouch(Offset touchPosition) {
//     for (var particle in _particles) {
//       final dx = particle.position.dx - touchPosition.dx;
//       final dy = particle.position.dy - touchPosition.dy;
//       final distance = sqrt(dx * dx + dy * dy);

//       if (distance < 150) {
//         final angle = atan2(dy, dx);
//         particle.velocity = Offset(
//           particle.velocity.dx + cos(angle) * 2,
//           particle.velocity.dy + sin(angle) * 2,
//         );
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final size = MediaQuery.of(context).size;

//     return GestureDetector(
//       onPanUpdate: (details) {
//         _handleTouch(details.localPosition);
//       },
//       child: Stack(
//         children: [
//           widget.child,
//           CustomPaint(
//             painter: FogPainter(
//               particles: _particles,
//               isDarkMode: widget.isDarkMode,
//             ),
//             size: Size.infinite,
//           ),
//         ],
//       ),
//     );
//   }
// }

// class FogParticle {
//   Offset position;
//   Offset velocity;
//   double radius;
//   double opacity;

//   FogParticle({
//     required this.position,
//     required this.velocity,
//     required this.radius,
//     required this.opacity,
//   });
// }

// class FogPainter extends CustomPainter {
//   final List<FogParticle> particles;
//   final bool isDarkMode;

//   FogPainter({
//     required this.particles,
//     required this.isDarkMode,
//   });

//   @override
//   void paint(Canvas canvas, Size size) {
//     final Paint paint = Paint();

//     for (var particle in particles) {
//       paint.color = (isDarkMode ? Colors.black : Colors.).withOpacity(particle.opacity);
//       canvas.drawCircle(particle.position, particle.radius, paint);
//     }
//   }

//   @override
//   bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
// }

// // Example usage
// void main() {
//   runApp(MaterialApp(
//     home: Scaffold(
//       body: FoggedScreenEffect(
//         isDarkMode: false,
//         child: ListView.builder(
//           itemCount: 50,
//           itemBuilder: (context, index) => ListTile(
//             title: Text('Item $index'),
//           ),
//         ),
//       ),
//     ),
//   ));
// }
