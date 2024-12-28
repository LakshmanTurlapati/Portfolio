import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'navbar.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool isDarkMode = false; 

  void toggleTheme() {
    setState(() {
      isDarkMode = !isDarkMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Portfolio v2',
      theme: ThemeData(
        brightness: isDarkMode ? Brightness.dark : Brightness.light,
        textTheme: GoogleFonts.latoTextTheme(),
        primarySwatch: Colors.blue,
      ),
      home: HomePage(toggleTheme: toggleTheme, isDarkMode: isDarkMode),
    );
  }
}

class HomePage extends StatefulWidget {
  final VoidCallback toggleTheme;
  final bool isDarkMode;

  const HomePage({super.key, required this.toggleTheme, required this.isDarkMode});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool isHovered = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                stops: [0.05, 0.4, 0.6, 0.95],
                colors: [
                  Color(0xFFFFFFFF), 
                  Color(0xFFD0D0D0), 
                  Color(0xFFD0D0D0), 
                  Color(0xFFFFFFFF), 
                ],
              ),
            ),
            child: const Center(
              child: Text(
                'Home Page',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ),
          ),

          
       const Positioned(
        top: 10,
        left: 0,
        right: 0,
        child: Center(
        child: NavBar(),
        ),
        ),

          // Bottom Left Icons for Dark and Light Mode
          Positioned(
            bottom: 20,
            left: 20,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Sun Icon for Light Mode
                GestureDetector(
                  onTap: widget.toggleTheme,
                  child: Icon(
                    Icons.wb_sunny,
                    size: 22,
                    color: widget.isDarkMode ? Colors.grey : Colors.black,
                  ),
                ),

                // Vertical Dashed Line
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: DashedLine(
                    height: 22,
                    dashWidth: 1,
                    dashHeight: 3,
                    color: Colors.black26,
                  ),
                ),

                // Moon Icon for Dark Mode
                GestureDetector(
                  onTap: widget.toggleTheme,
                  child: Icon(
                    Icons.nightlight_round,
                    size: 24,
                    color: widget.isDarkMode ? Colors.yellow : Colors.black26,
                  ),
                ),
              ],
            ),
          ),

          // Button in Bottom-Right Corner
          Positioned(
            bottom: 20,
            right: 20,
            child: GestureDetector(
              onTap: () {
                print('Venkat L. Turlapati clicked!');
              },
              child: MouseRegion(
                onEnter: (_) => setState(() => isHovered = true),
                onExit: (_) => setState(() => isHovered = false),
                cursor: SystemMouseCursors.click,
                child: Text(
                  'Venkat L. Turlapati',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    shadows: isHovered
                        ? [
                            const Shadow(
                              offset: Offset(2, 2),
                              blurRadius: 4,
                              color: Colors.black38,
                            ),
                          ]
                        : [],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
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

    double startY = 0;
    while (startY < size.height) {
      canvas.drawLine(
        Offset(0, startY),
        Offset(0, startY + dashHeight),
        paint,
      );
      startY += dashHeight * 2; // Space between dashes
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}