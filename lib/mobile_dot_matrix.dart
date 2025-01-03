import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart'; 
import 'dart:math';

class DotMatrixPattern extends StatefulWidget {
  final int rows;
  final int columns;
  final double dotSize;
  final bool isDarkMode;

  const DotMatrixPattern({
    Key? key,
    this.rows = 7,
    this.columns = 4 * 5,
    this.dotSize = 14.0,
    required this.isDarkMode,
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
      child: ShaderMask(
        shaderCallback: (Rect bounds) {
          return const LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              Colors.transparent,
              Colors.black,
              Colors.black,
              Colors.transparent,
            ],
            stops: [0.0, 0.1, 0.9, 1.0],
          ).createShader(bounds);
        },
        blendMode: BlendMode.dstIn,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(widget.rows, (rowIndex) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(widget.columns, (colIndex) {
                double intensity = _pattern[rowIndex][colIndex];
                bool isHovered = _hoveredDots[rowIndex]?[colIndex] ?? false;

                return MouseRegion(
                  cursor: SystemMouseCursors.click,
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
                      duration: const Duration(milliseconds: 300),
                      width: isHovered ? widget.dotSize + 3 : widget.dotSize,
                      height: isHovered ? widget.dotSize + 3 : widget.dotSize,
                      margin: EdgeInsets.all(widget.dotSize * 0.15),
                      decoration: BoxDecoration(
                        color: widget.isDarkMode
                            ? Color.lerp(
                                const Color(0xFFB0B0B0),
                                const Color(0xFF1A1A1A),
                                intensity,
                              )
                            : Color.lerp(
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
          child: DotMatrixPattern(isDarkMode: true),
        ),
      ),
    );
  }
}