import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart'; // Import url_launcher
import 'dart:math';

class DotMatrixPattern extends StatefulWidget {
  final int rows;
  final int columns;
  final double dotSize;

  const DotMatrixPattern({
    Key? key,
    this.rows = 7,
    this.columns = 12 * 4,
    this.dotSize = 14.0,
  }) : super(key: key);

  @override
  State<DotMatrixPattern> createState() => _DotMatrixPatternState();
}

class _DotMatrixPatternState extends State<DotMatrixPattern> {
  final List<List<double>> _pattern = [];
  final Map<int, Map<int, bool>> _hoveredDots = {};

  Future<void> _openUrl() async {
    const url = 'https://leetcode.com/u/PARZIVAL1213/';
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      throw 'Could not launch $url';
    }
  }

  @override
  void initState() {
    super.initState();

    final random = Random();
    for (int i = 0; i < widget.rows; i++) {
      _pattern.add(
        List.generate(widget.columns, (_) => random.nextDouble()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(widget.rows, (rowIndex) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(widget.columns, (colIndex) {
              double intensity = _pattern[rowIndex][colIndex];
              bool isHovered =
                  _hoveredDots[rowIndex]?[colIndex] ?? false; // Check hover state

              return MouseRegion(
                cursor: SystemMouseCursors.click, // Change cursor to hand
                onEnter: (_) {
                  setState(() {
                    _hoveredDots[rowIndex] ??= {};
                    _hoveredDots[rowIndex]![colIndex] = true;
                  });
                },
                onExit: (_) {
                  setState(() {
                    _hoveredDots[rowIndex]?[colIndex] = false;
                  });
                },
                child: GestureDetector(
                  onTap: _openUrl,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300), // Smooth animation
                    width: isHovered ? widget.dotSize + 3 : widget.dotSize,
                    height: isHovered ? widget.dotSize + 3 : widget.dotSize,
                    margin: EdgeInsets.all(widget.dotSize * 0.15),
                    decoration: BoxDecoration(
                      color: Color.lerp(
                        Colors.grey[300]!,
                        Colors.grey[800]!,
                        intensity,
                      ),
                      shape: BoxShape.rectangle,
                      borderRadius: BorderRadius.circular(widget.dotSize * 0.2),
                    ),
                  ),
                ),
              );
            }),
          );
        }),
      ),
    );
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Colors.transparent,
        body: const Center(
          child: DotMatrixPattern(),
        ),
      ),
    );
  }
}