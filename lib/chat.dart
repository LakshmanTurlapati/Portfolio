import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:ui'; // Import for ImageFilter

// API service to handle communication with the backend
class ChatApiService {
  static const String baseUrl = 'https://637d-2603-8080-61f0-8b0-552a-d298-9a93-5b2c.ngrok-free.app';
  
  // Health check endpoint
  Future<bool> checkHealth() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/health'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  // Generate response from prompt
  Future<String> generateResponse(String prompt, {int maxTokens = 100}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/generate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'prompt': prompt,
          'max_tokens': maxTokens,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['response'] ?? 'No response from the API';
      } else {
        return 'Error: ${response.statusCode}';
      }
    } catch (e) {
      return 'Error connecting to the API: $e';
    }
  }
}

// Message model to store chat messages
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  
  ChatMessage({
    required this.text,
    required this.isUser,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
  
  // Convert ChatMessage to JSON
  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'isUser': isUser,
      'timestamp': timestamp.toIso8601String(),
    };
  }
  
  // Create ChatMessage from JSON
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      text: json['text'],
      isUser: json['isUser'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}

// Simple in-memory chat history manager
// In a real app, you might want to use SharedPreferences or a database
class ChatHistoryManager {
  static List<ChatMessage> _history = [];
  static final StreamController<List<ChatMessage>> _controller = 
      StreamController<List<ChatMessage>>.broadcast();
  
  // Get current history
  static List<ChatMessage> get history => List.unmodifiable(_history);
  
  // Stream of history updates
  static Stream<List<ChatMessage>> get historyStream => _controller.stream;
  
  // Add a message to history
  static void addMessage(ChatMessage message) {
    _history.add(message);
    _controller.add(_history);
  }
  
  // Clear history
  static void clearHistory() {
    _history.clear();
    _controller.add(_history);
  }
}

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

  void _sendMessage() {
    final message = _controller.text;
    if (message.isNotEmpty) {
      // Store the message for use in the chat window
      final chatMessage = ChatMessage(
        text: message,
        isUser: true,
      );
      ChatHistoryManager.addMessage(chatMessage);
      
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
              begin: Alignment(-2.5 + _animationController.value * 5.0, 0.0),
              end: Alignment(-1.5 + _animationController.value * 5.0, 0.0),
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
          borderRadius: BorderRadius.circular(22),
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
                    cursorColor: widget.isDarkMode 
                        ? Colors.grey[800] 
                        : const Color(0xFF808080),
                    decoration: InputDecoration(
                      hintText: '',
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      isDense: true,
                      isCollapsed: true,
                    ),
                    autofocus: false,
                    onSubmitted: (_) => _sendMessage(),
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
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Add a new class for loading animation with rotating texts
class LoadingAnimatedText extends StatefulWidget {
  final bool isDarkMode;
  
  const LoadingAnimatedText({
    super.key,
    required this.isDarkMode,
  });
  
  @override
  State<LoadingAnimatedText> createState() => _LoadingAnimatedTextState();
}

class _LoadingAnimatedTextState extends State<LoadingAnimatedText> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  int _currentTextIndex = 0;
  
  final List<String> _loadingTexts = [
    "Waking up my private server",
    "Using Steam Deck as a server",
    "Almost there, Hold tight!",
    "Inferencing on my Steam Deck",
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    // Switch to next text every 4 seconds
    Timer.periodic(const Duration(seconds: 2), (timer) {
      if (mounted) {
        setState(() {
          _currentTextIndex = (_currentTextIndex + 1) % _loadingTexts.length;
        });
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
              begin: Alignment(-2.5 + _animationController.value * 5.0, 0.0),
              end: Alignment(-1.5 + _animationController.value * 5.0, 0.0),
              tileMode: TileMode.clamp,
            ).createShader(bounds);
          },
          blendMode: BlendMode.modulate,
          child: Text(
            _loadingTexts[_currentTextIndex],
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: widget.isDarkMode
                      ? Colors.grey[800]
                      : Colors.grey[300],
                  fontWeight: FontWeight.bold,
                ),
          ),
        );
      },
    );
  }
}

// Add this class for wave loading animation
class ThreeDotsWave extends StatefulWidget {
  final bool isDarkMode;
  
  const ThreeDotsWave({
    super.key,
    required this.isDarkMode,
  });
  
  @override
  State<ThreeDotsWave> createState() => _ThreeDotsWaveState();
}

class _ThreeDotsWaveState extends State<ThreeDotsWave> with TickerProviderStateMixin {
  late AnimationController _controller1;
  late AnimationController _controller2;
  late AnimationController _controller3;
  late AnimationController _shimmerController;
  
  late Animation<double> _animation1;
  late Animation<double> _animation2;
  late Animation<double> _animation3;

  @override
  void initState() {
    super.initState();
    
    _controller1 = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);
    
    _controller2 = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    
    _controller3 = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    
    // Add shimmer controller
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    _animation1 = Tween<double>(begin: 0.0, end: 1.0).animate(_controller1);
    _animation2 = Tween<double>(begin: 0.0, end: 1.0).animate(_controller2);
    _animation3 = Tween<double>(begin: 0.0, end: 1.0).animate(_controller3);
    
    // Sequence the animations with delays
    Future.delayed(const Duration(milliseconds: 170), () {
      if (mounted) _controller2.repeat(reverse: true);
    });
    
    Future.delayed(const Duration(milliseconds: 340), () {
      if (mounted) _controller3.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _controller1.dispose();
    _controller2.dispose();
    _controller3.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _shimmerController,
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
              begin: Alignment(-2.5 + _shimmerController.value * 5.0, 0.0),
              end: Alignment(-1.5 + _shimmerController.value * 5.0, 0.0),
              tileMode: TileMode.clamp,
            ).createShader(bounds);
          },
          blendMode: BlendMode.modulate,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDot(_animation1),
              const SizedBox(width: 2),
              _buildDot(_animation2),
              const SizedBox(width: 2),
              _buildDot(_animation3),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildDot(Animation<double> animation) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, 2 - 4 * animation.value),
          child: Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: widget.isDarkMode
                  ? Colors.grey[800]
                  : Colors.grey[300],
              shape: BoxShape.circle,
            ),
          ),
        );
      },
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
  
  final TextEditingController _messageController = TextEditingController();
  final FocusNode _messageFocusNode = FocusNode();
  final List<ChatMessage> _messages = [];
  final ScrollController _scrollController = ScrollController();
  final ChatApiService _apiService = ChatApiService();
  bool _isLoading = false;
  bool _isApiAvailable = false;
  StreamSubscription? _historySubscription;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 480), // Reduced duration by 40% (800 * 0.6)
    );
    
    // Initialize with default values
    _opacityAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.7), // Fade in during middle of animation
      ),
    );
    
    // Check if API is available
    _checkApiHealth();
    
    // Listen to chat history updates
    _historySubscription = ChatHistoryManager.historyStream.listen((messages) {
      setState(() {
        _messages.clear();
        _messages.addAll(messages);
      });
      _scrollToBottom();
    });
    
    // Load existing messages
    _messages.addAll(ChatHistoryManager.history);
    
    // Process the first message if available
    if (_messages.isNotEmpty && _messages.length == 1 && _messages.first.isUser) {
      // Delay to allow chat window to animate in
      Future.delayed(const Duration(milliseconds: 1000), () {
        _handleFirstMessage(_messages.first.text);
      });
    }
    
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
  
  Future<void> _checkApiHealth() async {
    final isAvailable = await _apiService.checkHealth();
    setState(() {
      _isApiAvailable = isAvailable;
    });
    
    if (!_isApiAvailable) {
      _addBotMessage("The server is currently down at the moment. It's either being updated or temporarily down for maintenance. Please try again later.");
    }
  }
  
  void _addBotMessage(String text) {
    final message = ChatMessage(
      text: text,
      isUser: false,
    );
    ChatHistoryManager.addMessage(message);
  }
  
  Future<void> _handleFirstMessage(String message) async {
    // Don't process the first message if API is unavailable
    if (!_isApiAvailable) {
      return;
    }
    
    // Set loading state
    setState(() {
      _isLoading = true;
    });
    
    // Get response from API for the first message (we already know it's available)
    try {
      final response = await _apiService.generateResponse(message);
      _addBotMessage(response);
    } catch (e) {
      _addBotMessage("Sorry, I encountered an error processing your request.");
    }
    
    setState(() {
      _isLoading = false;
    });
  }
  
  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOut,
        );
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _messageController.dispose();
    _messageFocusNode.dispose();
    _scrollController.dispose();
    _historySubscription?.cancel();
    super.dispose();
  }

  Widget _buildChatMessage(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 6, horizontal: message.isUser ? 0 : 4),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: message.isUser
                    ? (widget.isDarkMode 
                        ? Colors.black.withOpacity(0.7) // Black for user messages in dark mode
                        : Colors.white.withOpacity(0.8)) // White for user messages in light mode
                    : (widget.isDarkMode 
                        ? Colors.grey[300]?.withOpacity(0.7) 
                        : Colors.grey[800]?.withOpacity(0.6)),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: message.isUser
                      ? (widget.isDarkMode 
                          ? Colors.black.withOpacity(0.3) ?? Colors.transparent
                          : Colors.white.withOpacity(0.3) ?? Colors.transparent)
                      : (widget.isDarkMode 
                          ? Colors.grey[400]?.withOpacity(0.3) ?? Colors.transparent
                          : Colors.grey[700]?.withOpacity(0.2) ?? Colors.transparent),
                  width: 0.5,
                ),
              ),
              constraints: const BoxConstraints(maxWidth: 270),
              child: Text(
                message.text,
                style: TextStyle(
                  color: message.isUser
                      ? (widget.isDarkMode ? Colors.white : Colors.black) // Black text for white background in light mode
                      : (widget.isDarkMode ? Colors.black : Colors.white),
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Input field with blur effect that exactly matches the home page's expanded styling
  Widget _buildInputField(double chatAreaVisible) {
    // Calculate appropriate width based on available space
    final availableWidth = MediaQuery.of(context).size.width - 100; // Account for padding
    final inputWidth = availableWidth > 300 ? 300.0 : availableWidth; // Max width of 300
    
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
        child: Container(
          width: inputWidth, // Use calculated width
          padding: const EdgeInsets.fromLTRB(12, 6, 6, 6),
          constraints: const BoxConstraints(
            maxHeight: 60,
          ),
          decoration: BoxDecoration(
            color: widget.isDarkMode
                ? Colors.white.withOpacity(0.8)
                : Colors.black.withOpacity(0.8),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  focusNode: _messageFocusNode,
                  enabled: chatAreaVisible > 0.8 && _isApiAvailable, // Disable if API unavailable
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: widget.isDarkMode
                        ? Colors.grey[800]
                        : const Color(0xFF808080),
                    fontWeight: FontWeight.bold,
                  ),
                  cursorColor: widget.isDarkMode 
                      ? Colors.grey[800] 
                      : const Color(0xFF808080),
                  decoration: InputDecoration(
                    hintText: _isApiAvailable ? '' : 'Server Offline',
                    hintStyle: TextStyle(
                      color: widget.isDarkMode
                          ? Colors.grey[600]
                          : Colors.grey[400],
                      fontSize: 14,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.bold,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 8, 
                      vertical: 8
                    ),
                    isDense: true,
                    isCollapsed: true,
                  ),
                  textAlign: _isApiAvailable ? TextAlign.left : TextAlign.center,
                  onSubmitted: (_) => _handleSendMessage(),
                ),
              ),
              // Only show send button when API is available
              if (_isApiAvailable)
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
                    onPressed: chatAreaVisible > 0.8 ? _handleSendMessage : null,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
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
        
        // Add horizontal padding to the entire chat popup
        final paddedRect = Rect.fromLTWH(
          rect.left + 20, // Add left padding
          rect.top,
          rect.width - 40, // Reduce width to account for padding
          rect.height,
        );
        
        return Positioned.fromRect(
          rect: paddedRect,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(borderRadius),
            child: BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: 10.0,
                sigmaY: 10.0,
              ),
              child: Material(
                color: Colors.transparent,
                child: Container(
                  decoration: BoxDecoration(
                    // Reduced opacity to show blur through
                    color: backgroundColor.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(borderRadius),
                  ),
                  child: Stack(
                    children: [
                      // Close button in top right
                      Positioned(
                        top: 15,
                        right: 15,
                        child: Opacity(
                          opacity: _opacityAnimation!.value,
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: widget.isDarkMode 
                                  ? Colors.black.withOpacity(0.1) 
                                  : Colors.white.withOpacity(0.1),
                            ),
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              iconSize: 16,
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
                      ),
                      
                      // API status indicator (subtle dot)
                      Positioned(
                        top: 20,
                        left: 15,
                        child: Opacity(
                          opacity: _opacityAnimation!.value,
                          child: Container(
                            width: 8, // Slightly larger
                            height: 8, // Slightly larger
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isApiAvailable 
                                  ? const Color(0xFF00E676) // Brighter green color
                                  : Colors.red,
                              boxShadow: [
                                BoxShadow(
                                  color: _isApiAvailable 
                                      ? const Color(0xFF00E676).withOpacity(0.5) 
                                      : Colors.red.withOpacity(0.5),
                                  blurRadius: 4,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      
                      // Chat area - add bottom padding for footer and loading text
                      if (chatAreaVisible > 0.01)
                        Positioned(
                          top: 45,
                          left: 15,
                          right: 15,
                          bottom: 100, // Consistent spacing even when loading
                          child: Opacity(
                            opacity: chatAreaVisible,
                            child: Theme(
                              data: Theme.of(context).copyWith(
                                scrollbarTheme: const ScrollbarThemeData(
                                  thumbVisibility: MaterialStatePropertyAll(false),
                                  trackVisibility: MaterialStatePropertyAll(false),
                                  // Optional: Make colors transparent just in case
                                  thumbColor: MaterialStatePropertyAll(Colors.transparent),
                                  trackColor: MaterialStatePropertyAll(Colors.transparent),
                                  trackBorderColor: MaterialStatePropertyAll(Colors.transparent),
                                )
                              ),
                              child: Container(
                                child: ListView.builder(
                                  controller: _scrollController,
                                  padding: const EdgeInsets.only(top: 5, bottom: 20),
                                  itemCount: _messages.length + (_isLoading ? 1 : 0), // Add one item when loading
                                  itemBuilder: (context, index) {
                                    // If loading and at the last element, show loading bubble
                                    if (_isLoading && index == _messages.length) {
                                      return _buildLoadingMessageBubble();
                                    }
                                    
                                    // Add extra padding at the bottom of the last item (only if not loading)
                                    if (!_isLoading && index == _messages.length - 1) {
                                      return Column(
                                        children: [
                                          _buildChatMessage(_messages[index]),
                                          const SizedBox(height: 25), // Extra padding at bottom
                                        ],
                                      );
                                    }
                                    
                                    return _buildChatMessage(_messages[index]);
                                  },
                                ),
                              ),
                            ),
                          ),
                        ),
                      
                      // Footer text
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 80, // Just above the input field
                        child: Opacity(
                          opacity: chatAreaVisible,
                          child: Center(
                            child: Text(
                              "Still in experimental phase, can make mistakes",
                              style: TextStyle(
                                fontSize: 11,
                                fontStyle: FontStyle.italic,
                                color: widget.isDarkMode 
                                    ? Colors.black.withOpacity(0.5) 
                                    : Colors.white.withOpacity(0.5),
                              ),
                            ),
                          ),
                        ),
                      ),
                      
                      // Suggestion pills above input field (only when no messages)
                      if (_messages.isEmpty)
                        Positioned(
                          left: 15,
                          right: 15,
                          bottom: 65, // Above input field, below footer
                          child: Opacity(
                            opacity: chatAreaVisible,
                            child: Center(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // First pill
                                  GestureDetector(
                                    onTap: () {
                                      _messageController.text = "Who are you?";
                                      _handleSendMessage();
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        // Match input field colors
                                        color: widget.isDarkMode
                                            ? Colors.white.withOpacity(0.6)
                                            : Colors.black.withOpacity(0.6),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: widget.isDarkMode 
                                              ? Colors.white.withOpacity(0.2)
                                              : Colors.black.withOpacity(0.2),
                                          width: 0.5,
                                        ),
                                      ),
                                      child: Text(
                                        "Who are you?",
                                        style: TextStyle(
                                          // Match input text colors
                                          color: widget.isDarkMode
                                              ? Colors.grey[800]
                                              : const Color(0xFF808080),
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Second pill
                                  GestureDetector(
                                    onTap: () {
                                      _messageController.text = "What music do you listen to?";
                                      _handleSendMessage();
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        // Match input field colors
                                        color: widget.isDarkMode
                                            ? Colors.white.withOpacity(0.6)
                                            : Colors.black.withOpacity(0.6),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: widget.isDarkMode 
                                              ? Colors.white.withOpacity(0.2)
                                              : Colors.black.withOpacity(0.2),
                                          width: 0.5,
                                        ),
                                      ),
                                      child: Text(
                                        "What music do you listen to?",
                                        style: TextStyle(
                                          // Match input text colors
                                          color: widget.isDarkMode
                                              ? Colors.grey[800]
                                              : const Color(0xFF808080),
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      
                      // Input field
                      Positioned(
                        left: 15,
                        right: 15,
                        bottom: 15,
                        child: _buildInputField(chatAreaVisible),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // Update to handle send message with auto-scrolling and retain focus
  void _handleSendMessage() async {
    // Don't allow sending messages if API is unavailable
    if (!_isApiAvailable) {
      return;
    }
    
    final message = _messageController.text.trim();
    if (message.isEmpty) return;
    
    // Add user message
    final userMessage = ChatMessage(
      text: message,
      isUser: true,
    );
    ChatHistoryManager.addMessage(userMessage);
    _messageController.clear();
    
    // Scroll to the new message
    _scrollToBottom();
    
    // Request focus back to the input field
    _messageFocusNode.requestFocus();
    
    setState(() {
      _isLoading = true;
    });
    
    // Get response from API (we already know it's available at this point)
    try {
      final response = await _apiService.generateResponse(message);
      _addBotMessage(response);
      // Scroll again after response arrives
      _scrollToBottom();
    } catch (e) {
      _addBotMessage("Sorry, I encountered an error processing your request.");
      _scrollToBottom();
    }
    
    setState(() {
      _isLoading = false;
    });
  }

  // Add a new loading message bubble builder
  Widget _buildLoadingMessageBubble() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: widget.isDarkMode 
                    ? Colors.grey[300]?.withOpacity(0.7) 
                    : Colors.grey[800]?.withOpacity(0.6),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: widget.isDarkMode 
                      ? Colors.grey[400]?.withOpacity(0.3) ?? Colors.transparent
                      : Colors.grey[700]?.withOpacity(0.2) ?? Colors.transparent,
                  width: 0.5,
                ),
              ),
              constraints: const BoxConstraints(maxWidth: 270),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  LoadingAnimatedText(isDarkMode: widget.isDarkMode),
                  const SizedBox(width: 8), // Gap between text and dots
                  ThreeDotsWave(isDarkMode: widget.isDarkMode),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}