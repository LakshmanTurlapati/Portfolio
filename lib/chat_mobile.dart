import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:ui'; // Import for ImageFilter

// Reuse the same API service from chat.dart
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

// Loading animation with rotating texts (reused from desktop)
class LoadingAnimatedText extends StatefulWidget {
  final bool isDarkMode;
  
  const LoadingAnimatedText({
    super.key,
    required this.isDarkMode,
  });
  
  @override
  State<LoadingAnimatedText> createState() => _LoadingAnimatedTextState();
}

class _LoadingAnimatedTextState extends State<LoadingAnimatedText> with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late AnimationController _shimmerController;
  
  final List<String> _loadingTexts = [
    'Thinking...',
    'Reflecting...',
    'Analyzing...',
    'Processing...',
    'Computing...',
  ];
  
  int _currentTextIndex = 0;

  @override
  void initState() {
    super.initState();
    
    _controllers = List.generate(3, (index) => 
      AnimationController(
        duration: const Duration(milliseconds: 500),
        vsync: this,
      )
    );
    
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    // Start the text rotation timer
    Timer.periodic(const Duration(milliseconds: 1500), (timer) {
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
    for (var controller in _controllers) {
      controller.dispose();
    }
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

// Three dots wave animation (reused from desktop)
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

// Main Mobile Chat Page
class ChatMobilePage extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback? toggleTheme;

  const ChatMobilePage({
    super.key,
    required this.isDarkMode,
    this.toggleTheme,
  });

  @override
  State<ChatMobilePage> createState() => _ChatMobilePageState();
}

class _ChatMobilePageState extends State<ChatMobilePage> {
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
    
    // Auto-focus on input field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _messageFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _messageFocusNode.dispose();
    _scrollController.dispose();
    _historySubscription?.cancel();
    super.dispose();
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

  Widget _buildChatMessage(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 6, horizontal: message.isUser ? 0 : 4),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 35.0, sigmaY: 35.0), // Reduced by 30% from 50.0 to 35.0
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: message.isUser
                    ? (widget.isDarkMode 
                        ? Colors.black.withOpacity(0.7) 
                        : Colors.white.withOpacity(0.9))
                    : (widget.isDarkMode 
                        ? Colors.grey[300]?.withOpacity(0.7) 
                        : Colors.grey[800]?.withOpacity(0.6)),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: message.isUser
                      ? (widget.isDarkMode 
                          ? Colors.white.withOpacity(0.3) 
                          : Colors.black.withOpacity(0.2))
                      : (widget.isDarkMode 
                          ? Colors.grey[400]?.withOpacity(0.3) ?? Colors.transparent
                          : Colors.grey[700]?.withOpacity(0.2) ?? Colors.transparent),
                  width: 0.5,
                ),
              ),
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              child: Text(
                message.text,
                style: TextStyle(
                  color: message.isUser
                      ? (widget.isDarkMode ? Colors.white : Colors.black)
                      : (widget.isDarkMode ? Colors.black : Colors.white),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingMessageBubble() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 35.0, sigmaY: 35.0), // Reduced by 30% from 50.0 to 35.0
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
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  LoadingAnimatedText(isDarkMode: widget.isDarkMode),
                  const SizedBox(width: 8),
                  ThreeDotsWave(isDarkMode: widget.isDarkMode),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField() {
    // Exact desktop width calculation logic - increased by 20%
    final availableWidth = MediaQuery.of(context).size.width - 100; // Account for padding
    final inputWidth = (availableWidth > 300 ? 300.0 : availableWidth) * 1.2; // Increased by 20%
    
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 35.0, sigmaY: 35.0), // Reduced by 30% from 50.0 to 35.0
        child: Container(
          width: inputWidth, // Use calculated width like desktop
          padding: const EdgeInsets.fromLTRB(12, 6, 6, 6), // Exact desktop padding
          constraints: const BoxConstraints(maxHeight: 60), // Exact desktop constraint
          decoration: BoxDecoration(
            // Exact desktop input field colors
            color: widget.isDarkMode
                ? Colors.white.withOpacity(0.8) // Exact desktop dark mode
                : Colors.black.withOpacity(0.8), // Exact desktop light mode
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  focusNode: _messageFocusNode,
                  enabled: _isApiAvailable, // Match desktop API availability logic
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    // Exact desktop text colors
                    color: widget.isDarkMode
                        ? Colors.grey[800] // Exact desktop dark mode text
                        : const Color(0xFF808080), // Exact desktop light mode text
                    fontWeight: FontWeight.bold, // Exact desktop font weight
                  ),
                  cursorColor: widget.isDarkMode 
                      ? Colors.grey[800] // Exact desktop dark mode cursor
                      : const Color(0xFF808080), // Exact desktop light mode cursor
                  decoration: InputDecoration(
                    // Match desktop hint text logic
                    hintText: _isApiAvailable ? 'Type a message...' : 'Server Offline', // Added placeholder
                    hintStyle: TextStyle(
                      color: widget.isDarkMode
                          ? Colors.grey[600] // Exact desktop dark mode hint
                          : Colors.grey[400], // Exact desktop light mode hint
                      fontSize: 14, // Exact desktop font size
                      fontStyle: FontStyle.italic, // Exact desktop style
                      fontWeight: FontWeight.bold, // Exact desktop weight
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8), // Reduced from 8 to 4
                    isDense: true,
                    isCollapsed: true,
                  ),
                  // Match desktop text alignment logic
                  textAlign: _isApiAvailable ? TextAlign.left : TextAlign.center,
                  onSubmitted: (_) => _handleSendMessage(),
                ),
              ),
              // Restore send button
              if (_isApiAvailable)
                Container(
                  decoration: BoxDecoration(
                    // Exact desktop button colors
                    color: widget.isDarkMode ? Colors.black : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: IconButton(
                    icon: Icon(
                      Icons.arrow_upward,
                      // Exact desktop icon colors
                      color: widget.isDarkMode ? Colors.white : Colors.black,
                    ),
                    onPressed: _handleSendMessage,
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
    // Exact replica of desktop popup background color logic
    final backgroundColor = widget.isDarkMode ? Colors.white : Colors.black;
    
    return Scaffold(
      // Remove any background to ensure full transparency
      backgroundColor: Colors.transparent,
      // Extend body behind system UI for true full screen
      extendBodyBehindAppBar: true,
      extendBody: true,
      body: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: 70.0, // Reduced by 30% from 100.0 to 70.0
          sigmaY: 70.0, // Reduced by 30% from 100.0 to 70.0
        ),
        // Remove BlendMode.src to restore proper blur behavior
        child: Container(
          // Full screen coverage including system UI areas
          width: MediaQuery.of(context).size.width,
          height: MediaQuery.of(context).size.height,
          decoration: BoxDecoration(
            color: backgroundColor.withOpacity(0.6), // Exact desktop opacity
          ),
          child: SafeArea(
            // Don't apply safe area to maintain full screen blur
            top: false,
            bottom: false,
            child: Stack(
              children: [
                Column(
                  children: [
                    // Status bar with API indicator - matches desktop positioning
                    Container(
                      padding: const EdgeInsets.only(top: 60, left: 15, right: 15, bottom: 10), // Extra top padding for status bar
                      child: Row(
                        children: [
                          // API status indicator - exact desktop implementation
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isApiAvailable 
                                  ? const Color(0xFF00E676) // Exact desktop green
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
                          const SizedBox(width: 8),
                          Text(
                            _isApiAvailable ? 'Online' : 'Offline',
                            style: TextStyle(
                              // Match desktop text colors
                              color: widget.isDarkMode 
                                  ? Colors.black.withOpacity(0.5) 
                                  : Colors.white.withOpacity(0.5),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Chat area - exact desktop positioning
                    Expanded(
                      child: Theme(
                        // Exact desktop scrollbar theme
                        data: Theme.of(context).copyWith(
                          scrollbarTheme: const ScrollbarThemeData(
                            thumbVisibility: MaterialStatePropertyAll(false),
                            trackVisibility: MaterialStatePropertyAll(false),
                            thumbColor: MaterialStatePropertyAll(Colors.transparent),
                            trackColor: MaterialStatePropertyAll(Colors.transparent),
                            trackBorderColor: MaterialStatePropertyAll(Colors.transparent),
                          )
                        ),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 15), // Match desktop
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.only(top: 5, bottom: 20), // Match desktop
                            itemCount: _messages.length + (_isLoading ? 1 : 0),
                            itemBuilder: (context, index) {
                              if (_isLoading && index == _messages.length) {
                                return _buildLoadingMessageBubble();
                              }
                              
                              // Match desktop bottom padding logic
                              if (!_isLoading && index == _messages.length - 1) {
                                return Column(
                                  children: [
                                    _buildChatMessage(_messages[index]),
                                    const SizedBox(height: 25), // Exact desktop padding
                                  ],
                                );
                              }
                              
                              return _buildChatMessage(_messages[index]);
                            },
                          ),
                        ),
                      ),
                    ),
                    
                    // Footer text - exact desktop positioning and styling
                    Container(
                      padding: const EdgeInsets.only(bottom: 20), // Moved closer to input (was 65)
                      child: Center(
                        child: Text(
                          "Still in experimental phase, can make mistakes",
                          style: TextStyle(
                            fontSize: 11, // Exact desktop font size
                            fontStyle: FontStyle.italic,
                            // Exact desktop footer text colors
                            color: widget.isDarkMode 
                                ? Colors.black.withOpacity(0.5) 
                                : Colors.white.withOpacity(0.5),
                          ),
                        ),
                      ),
                    ),
                    
                    // Suggestion pills above input field
                    if (_messages.isEmpty) // Only show when no messages
                      Container(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                        child: Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center, // Center the pills horizontally
                            mainAxisSize: MainAxisSize.min, // Take only space needed
                            children: [
                              // First pill - only takes content width
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
                                        ? Colors.white.withOpacity(0.6) // Similar to input background
                                        : Colors.black.withOpacity(0.6), // Similar to input background
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
                                          ? Colors.grey[800] // Same as input text
                                          : const Color(0xFF808080), // Same as input text
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold, // Match input font weight
                                    ),
                                    textAlign: TextAlign.left, // Changed from center to left
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Second pill - only takes content width
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
                                        ? Colors.white.withOpacity(0.6) // Similar to input background
                                        : Colors.black.withOpacity(0.6), // Similar to input background
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
                                          ? Colors.grey[800] // Same as input text
                                          : const Color(0xFF808080), // Same as input text
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold, // Match input font weight
                                    ),
                                    textAlign: TextAlign.left, // Changed from center to left
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    
                    // Input field - exact desktop positioning
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 30), // Changed from 15 to 12 left/right
                      child: _buildInputField(),
                    ),
                  ],
                ),
                
                // Back chevron positioned at top-right - just the icon without button styling
                Positioned(
                  right: 20,
                  top: 50, // Moved up from 70 to 50
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    onPanStart: (details) {
                      // Could add drag-to-close functionality here if needed
                    },
                    onPanUpdate: (details) {
                      // Drag logic for closing
                      if (details.delta.dx < -5) { // Dragging left
                        Navigator.of(context).pop();
                      }
                    },
                    child: Icon(
                      Icons.arrow_back_ios, // Back to left-pointing arrow
                      color: Colors.white,
                      size: 24, // Slightly larger since no container
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.5),
                          blurRadius: 4,
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
  }

  void _handleSendMessage() async {
    if (!_isApiAvailable) return;
    
    final message = _messageController.text.trim();
    if (message.isEmpty) return;
    
    // Add user message
    final userMessage = ChatMessage(
      text: message,
      isUser: true,
    );
    ChatHistoryManager.addMessage(userMessage);
    _messageController.clear();
    
    _scrollToBottom();
    _messageFocusNode.requestFocus();
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final response = await _apiService.generateResponse(message);
      _addBotMessage(response);
      _scrollToBottom();
    } catch (e) {
      _addBotMessage("Sorry, I encountered an error processing your request.");
      _scrollToBottom();
    }
    
    setState(() {
      _isLoading = false;
    });
  }
} 