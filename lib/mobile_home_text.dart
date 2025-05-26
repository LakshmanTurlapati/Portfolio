import 'dart:async';
import 'package:flutter/material.dart';
import 'dart:ui'; // Import for ImageFilter
import 'chat_mobile.dart';

class ScrollingText extends StatefulWidget {
  final bool isDarkMode;
  final int clickCount;

  const ScrollingText({
    super.key, 
    this.isDarkMode = false,
    this.clickCount = 0,
  });

  @override
  _ScrollingTextState createState() => _ScrollingTextState();
}

class _ScrollingTextState extends State<ScrollingText> with TickerProviderStateMixin {
  final List<String> roles = [
    'UI/UX Designer',
    'Product Developer',
    'Software Developer',
    'Full-Stack Developer',
    'Cloud Developer',
    'AI Developer',
  ];

  late FixedExtentScrollController _scrollController;
  late Timer _timer;
  late AnimationController _waveAnimationController;
  late AnimationController _arrowBounceController;

  int _currentIndex = 0;
  double _dragProgress = 0.0; // Track drag progress
  bool _isDragging = false;
  bool _showAnimations = false; // Track if animations should be shown
  Timer? _animationDelayTimer; // Timer for delaying animations
  int _previousClickCount = 0; // Track previous click count to detect changes

  @override
  void initState() {
    super.initState();
    _previousClickCount = widget.clickCount;
    _scrollController = FixedExtentScrollController(initialItem: 0);

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _currentIndex = (_currentIndex + 1);
        _scrollController.animateToItem(
          _currentIndex,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      });
    });

    // Initialize wave animation controller
    _waveAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    // Initialize arrow bounce animation controller
    _arrowBounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void didUpdateWidget(ScrollingText oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Check if click count changed from 0 to > 0
    if (_previousClickCount == 0 && widget.clickCount > 0) {
      // Reset animations state and start delay timer
      _showAnimations = false;
      _animationDelayTimer?.cancel();
      _animationDelayTimer = Timer(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _showAnimations = true;
          });
        }
      });
    } else if (widget.clickCount == 0) {
      // If count goes back to 0, immediately hide animations
      _animationDelayTimer?.cancel();
      _showAnimations = false;
    } else if (widget.clickCount > 0 && _previousClickCount > 0) {
      // If count was already > 0 and still > 0, keep showing animations
      _showAnimations = true;
    }
    
    _previousClickCount = widget.clickCount;
  }

  @override
  void dispose() {
    _timer.cancel();
    _animationDelayTimer?.cancel();
    _scrollController.dispose();
    _waveAnimationController.dispose();
    _arrowBounceController.dispose();
    super.dispose();
  }

  void _onArrowTap() {
    // Simple slide animation to actual chat page
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false, // Keep previous page visible behind
        pageBuilder: (context, animation, secondaryAnimation) => ChatMobilePage(
          isDarkMode: widget.isDarkMode,
          toggleTheme: () {}, // Empty callback for slide screen
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(-1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOut;

          var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
          var offsetAnimation = animation.drive(tween);

          return SlideTransition(
            position: offsetAnimation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  void _onPanEnd(DragEndDetails details) {
    print('Drag ended with velocity: ${details.velocity.pixelsPerSecond.dx}');
    
    // If dragged far enough or fast enough, navigate to actual chat page
    if (_dragProgress > 0.5 || details.velocity.pixelsPerSecond.dx > 300) {
      _onArrowTap(); // Navigate to actual page
      setState(() {
        _isDragging = false;
        _dragProgress = 0.0;
      });
    } else {
      // Reset if not dragged far enough
      setState(() {
        _isDragging = false;
        _dragProgress = 0.0;
      });
    }
  }

  Widget _buildAnimatedArrow() {
    if (!_showAnimations) {
      return const SizedBox.shrink(); // Don't show arrow when animations are not enabled
    }

    return AnimatedBuilder(
      animation: _arrowBounceController,
      builder: (context, child) {
        // Create bouncing effect - left to right and back (only when not dragging)
        double bounceOffset = _isDragging ? 0 : 12.0 * (0.5 + 0.5 * (1 - _arrowBounceController.value).abs());
        
        return Transform.translate(
          offset: Offset(bounceOffset, 0),
          child: GestureDetector(
            onTap: () {
              _onArrowTap();
            },
            onPanStart: (details) {
              setState(() {
                _isDragging = true;
                _dragProgress = 0.0;
              });
              print('Drag started on arrow');
            },
            onPanUpdate: (details) {
              setState(() {
                _dragProgress = (_dragProgress + details.delta.dx / 100).clamp(0.0, 1.0);
              });
              print('Dragging right: ${details.delta.dx}, Progress: $_dragProgress');
            },
            onPanEnd: _onPanEnd,
            child: Container(
              padding: const EdgeInsets.all(12), // Add 12px padding around the icon
              child: Icon(
                Icons.arrow_forward_ios,
                color: widget.isDarkMode ? Colors.white.withOpacity(0.8) : Colors.black.withOpacity(0.8),
                size: 18,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAnimatedText() {
    // Debug print to help verify count is working
    print('Mobile Home Text - clickCount: ${widget.clickCount}, showAnimations: $_showAnimations');
    
    if (!_showAnimations) {
      // No animation when animations are not enabled
      return Text.rich(
        TextSpan(
          children: [
            const TextSpan(
              text: 'What ',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.normal,
              ),
            ),
            const TextSpan(
              text: 'Defines',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold, // Bold style for "Defines"
              ),
            ),
            const TextSpan(
              text: ' me?',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        style: TextStyle(
          color: widget.isDarkMode ? Colors.white : Colors.black,
        ),
      );
    } else {
      // Wave animation when animations are enabled
      return AnimatedBuilder(
        animation: _waveAnimationController,
        builder: (context, child) {
          return ShaderMask(
            shaderCallback: (Rect bounds) {
              return LinearGradient(
                colors: [
                  (widget.isDarkMode ? Colors.white : Colors.black).withOpacity(0.3),
                  widget.isDarkMode ? Colors.white : Colors.black,
                  widget.isDarkMode ? Colors.white : Colors.black,
                  (widget.isDarkMode ? Colors.white : Colors.black).withOpacity(0.3),
                ],
                stops: const [0.0, 0.4, 0.6, 1.0],
                begin: Alignment(-3.0 + _waveAnimationController.value * 6.0, 0.0),
                end: Alignment(-2.0 + _waveAnimationController.value * 6.0, 0.0),
                tileMode: TileMode.clamp,
              ).createShader(bounds);
            },
            blendMode: BlendMode.modulate,
            child: Text.rich(
              TextSpan(
                children: [
                  const TextSpan(
                    text: 'What ',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.normal,
                    ),
                  ),
                  const TextSpan(
                    text: 'Defines',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold, // Bold style for "Defines"
                    ),
                  ),
                  const TextSpan(
                    text: ' me?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.normal,
                    ),
                  ),
                ],
              ),
              style: TextStyle(
                color: widget.isDarkMode ? Colors.white : Colors.black,
              ),
            ),
          );
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Main content
        Row(
          children: [
            // Rotated Static Text on the Left with Arrow
            Padding(
              padding: const EdgeInsets.only(left: 20), // 20px left margin
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  RotatedBox(
                    quarterTurns: 3, // Rotate 90 degrees counter-clockwise
                    child: _buildAnimatedText(),
                  ),
                  // Arrow positioned to the right of the text - pointing screen right
                  if (_showAnimations) ...[
                    const SizedBox(width: 12), // 12px spacing from text
                    // Chevron that moves with the page during drag
                    Transform.translate(
                      offset: Offset(_dragProgress * MediaQuery.of(context).size.width, 0),
                      child: _buildAnimatedArrow(),
                    ),
                  ],
                ],
              ),
            ),

            // Expand to Fill Space Dynamically
            Expanded(
              child: Container(), // Empty container to take up dynamic space
            ),

            // Scrolling Text on the Right Edge
            Padding(
              padding: const EdgeInsets.only(right: 20), // 20px right margin
              child: SizedBox(
                height: 150,
                width: 230, // Fixed width for scrolling text
                child: ShaderMask(
                  shaderCallback: (Rect bounds) {
                    return const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black,
                        Colors.transparent,
                      ],
                      stops: [0.0, 0.5, 1.0],
                    ).createShader(bounds);
                  },
                  blendMode: BlendMode.dstIn,
                  child: ListWheelScrollView.useDelegate(
                    controller: _scrollController,
                    physics: const FixedExtentScrollPhysics(),
                    perspective: 0.003,
                    itemExtent: 30,
                    childDelegate: ListWheelChildLoopingListDelegate(
                      children: roles.map((role) {
                        return Text(
                          role,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: widget.isDarkMode ? Colors.white : Colors.black,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}