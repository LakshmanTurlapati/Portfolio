import 'package:flutter/material.dart';

class ChatPlaceholder extends StatefulWidget {
  final bool isDarkMode;
  final double initialWidth;
  final ValueChanged<Rect> onSendMessage;

  const ChatPlaceholder({
    super.key,
    required this.isDarkMode,
    required this.initialWidth,
    required this.onSendMessage,
  });

  @override
  State<ChatPlaceholder> createState() => _ChatPlaceholderState();
}

class _ChatPlaceholderState extends State<ChatPlaceholder> with SingleTickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  double _width = 200;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _width = widget.initialWidth;
    _focusNode.addListener(_onFocusChange);

    // Initialize animation controller
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  void _onFocusChange() {
    setState(() {
      _width = _focusNode.hasFocus ? widget.initialWidth * 1.5 : widget.initialWidth;
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Widget _buildAnimatedText(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (Rect bounds) {
            return LinearGradient(
              colors: [
                Colors.grey.withOpacity(1),
                Colors.white,
                Colors.white,
                Colors.grey.withOpacity(1),
              ],
              stops: const [0.0, 0.45, 0.55, 1.0],
              begin: Alignment(-1.5 + _animationController.value * 3.0, 0.0),
              end: Alignment(-0.5 + _animationController.value * 3.0, 0.0),
              tileMode: TileMode.clamp,
            ).createShader(bounds);
          },
          blendMode: BlendMode.modulate,
          child: Text(
            'Talk to my persona!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: widget.isDarkMode
                      ? Colors.grey[500]
                      : Colors.grey[500],
                  fontWeight: FontWeight.bold,
                ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).requestFocus(_focusNode);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: _width,
        padding: const EdgeInsets.fromLTRB(12, 6, 6, 6),
        constraints: const BoxConstraints(
          maxHeight: 60,
        ),
        decoration: BoxDecoration(
          color: widget.isDarkMode
              ? Colors.white.withOpacity(0.8)
              : Colors.black.withOpacity(0.8),
          borderRadius: BorderRadius.circular(25),
        ),
        child: Row(
          children: [
            Expanded(
              child: Stack(
                alignment: Alignment.centerLeft,
                children: [
                  if (!_focusNode.hasFocus)
                    Positioned(
                      left: 8, // Controls the left padding of the animated text
                      child: _buildAnimatedText(context),
                    ),
                  TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: widget.isDarkMode
                              ? Colors.grey[800]
                              : const Color(0xFF808080),
                          fontWeight: FontWeight.bold,
                        ),
                    decoration: InputDecoration(
                      hintText: '',
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      isDense: true,
                      isCollapsed: true,
                    ),
                    autofocus: false,
                  ),
                ],
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: widget.isDarkMode ? Colors.black : Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: IconButton(
                icon: Icon(
                  Icons.arrow_upward,
                  color: widget.isDarkMode ? Colors.white : Colors.black,
                ),
                onPressed: () {
                  final message = _controller.text;
                  if (message.isNotEmpty) {
                    final renderBox = context.findRenderObject() as RenderBox;
                    final position = renderBox.localToGlobal(Offset.zero);
                    final size = renderBox.size;
                    
                    widget.onSendMessage(Rect.fromLTWH(
                      position.dx,
                      position.dy,
                      size.width,
                      size.height,
                    ));
                    
                    _controller.clear();
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ChatPopup extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback onClose;
  final Rect initialRect;

  const ChatPopup({
    super.key,
    required this.isDarkMode,
    required this.onClose,
    required this.initialRect,
  });

  @override
  State<ChatPopup> createState() => _ChatPopupState();
}

class _ChatPopupState extends State<ChatPopup> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  Animation<double>? _opacityAnimation;
  Animation<Rect?>? _rectAnimation;
  Animation<double>? _borderRadiusAnimation;
  Animation<double>? _buttonMoveAnimation;
  Animation<double>? _chatAreaGrowAnimation;
  Animation<Color?>? _backgroundColorAnimation;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800), // Longer for smoother effect
    );
    
    // Initialize with default values
    _opacityAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.7), // Fade in during middle of animation
      ),
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final mediaQuery = MediaQuery.of(context);
      final screenSize = mediaQuery.size;
      final targetRect = Rect.fromCenter(
        center: screenSize.center(Offset.zero),
        width: 400,
        height: 600,
      );

      // Initial button position (relative to container)
      final initialButtonPosition = Size(widget.initialRect.width - 40, widget.initialRect.height / 2);
      // Final button position (bottom of popup)
      final finalButtonPosition = Size(targetRect.width / 2, targetRect.height - 40);

      setState(() {
        // Rectangle animation with custom curve
        _rectAnimation = RectTween(
          begin: widget.initialRect,
          end: targetRect,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: Curves.easeOutCubic, // Start fast, end slow
          ),
        );
        
        // Border radius animation (from rounded input to less rounded popup)
        _borderRadiusAnimation = Tween<double>(
          begin: 25.0,
          end: 15.0,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.0, 0.6, curve: Curves.easeInOut),
          ),
        );
        
        // Button movement animation
        _buttonMoveAnimation = Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.2, 0.7, curve: Curves.easeInOutCubic),
          ),
        );
        
        // Chat area growth animation
        _chatAreaGrowAnimation = Tween<double>(
          begin: 0.0,
          end: 1.0, 
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.4, 0.9, curve: Curves.easeOut),
          ),
        );
        
        // Background color animation
        _backgroundColorAnimation = ColorTween(
          begin: widget.isDarkMode 
              ? Colors.white.withOpacity(0.8)
              : Colors.black.withOpacity(0.8),
          end: widget.isDarkMode
              ? Colors.white
              : Colors.black,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
          ),
        );
        
        _isInitialized = true;
      });

      _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const SizedBox.shrink();
    }
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final rect = _rectAnimation?.value ?? widget.initialRect;
        final borderRadius = _borderRadiusAnimation?.value ?? 25.0;
        final buttonPosition = _buttonMoveAnimation?.value ?? 0.0;
        final chatAreaVisible = _chatAreaGrowAnimation?.value ?? 0.0;
        final backgroundColor = _backgroundColorAnimation?.value ?? 
            (widget.isDarkMode ? Colors.white : Colors.black);
        
        return Positioned.fromRect(
          rect: rect,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(borderRadius),
            child: Material(
              color: Colors.transparent,
              child: Container(
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: BorderRadius.circular(borderRadius),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 20,
                      spreadRadius: 5,
                    )
                  ],
                ),
                child: Stack(
                  children: [
                    // Title - slides in from the left
                    Positioned(
                      top: 20,
                      left: 20 * _opacityAnimation!.value,
                      child: Opacity(
                        opacity: _opacityAnimation!.value,
                        child: Text(
                          'Lakshman\'s AI',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: widget.isDarkMode ? Colors.black : Colors.white,
                          ),
                        ),
                      ),
                    ),
                    
                    // Close button - fades in at the corner
                    Positioned(
                      top: 20,
                      right: 20,
                      child: Opacity(
                        opacity: _opacityAnimation!.value,
                        child: IconButton(
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          icon: Icon(
                            Icons.close,
                            color: widget.isDarkMode ? Colors.black : Colors.white,
                          ),
                          onPressed: () {
                            _controller.reverse().then((_) => widget.onClose());
                          },
                        ),
                      ),
                    ),
                    
                    // Chat area - grows from nothing
                    if (chatAreaVisible > 0.01)
                      Positioned(
                        top: 60,
                        left: 20,
                        right: 20,
                        bottom: 80,
                        child: Opacity(
                          opacity: chatAreaVisible,
                          child: Transform.scale(
                            scale: 0.5 + (0.5 * chatAreaVisible),
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(15),
                                color: widget.isDarkMode 
                                    ? Colors.black.withOpacity(0.1 * chatAreaVisible)
                                    : Colors.white.withOpacity(0.1 * chatAreaVisible),
                              ),
                            ),
                          ),
                        ),
                      ),
                    
                    // Input field - morphs from original to bottom position
                    Positioned(
                      left: 20,
                      right: 20,
                      // Start at middle height, move to bottom
                      bottom: buttonPosition * 20 ,
                      height: 50,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: widget.isDarkMode
                              ? Colors.black.withOpacity(0.1)
                              : Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(25),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                style: TextStyle(
                                  color: widget.isDarkMode ? Colors.black : Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                                decoration: InputDecoration(
                                  hintText: 'Talk to my persona!',
                                  hintStyle: TextStyle(
                                    color: widget.isDarkMode
                                        ? Colors.grey[700]
                                        : Colors.grey[400],
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                  isDense: true,
                                  isCollapsed: true,
                                ),
                              ),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                color: widget.isDarkMode ? Colors.black : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: IconButton(
                                icon: Icon(
                                  Icons.arrow_upward,
                                  color: widget.isDarkMode ? Colors.white : Colors.black,
                                ),
                                onPressed: () {},
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}