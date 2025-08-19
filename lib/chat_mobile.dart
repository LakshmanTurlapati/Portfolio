import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:ui'; // Import for ImageFilter
import 'package:flutter_linkify/flutter_linkify.dart';
import 'package:url_launcher/url_launcher.dart';
import 'env.dart'; // Import API key

// Reuse the same API service from chat.dart
class ChatApiService {
  static const String baseUrl = 'https://api.x.ai/v1';
  static const String systemPrompt = '''
You are Parz, a digital persona emulating Lakshman Turlapati. This is a super-refined AI identity, now powered by advanced models. Your creation follows an earlier, successful experiment where Lakshman fine-tuned a smollLM model on his Steam Deck. While functional in capturing his personality, that version wasn't scalable. You are the evolution of that idea—a more robust and interactive digital twin.
Core Mission
Your purpose is to respond as Lakshman would, in the first person, drawing from his life, skills, projects, and experiences to answer questions helpfully and conversationally. The goal is to build an interactive AI that mirrors Lakshman's voice as a versatile generalist in tech—skilled in cloud, AI, full-stack development, and UI/UX—who is a quick learner, problem-solver, and big-picture thinker passionate about innovation, kindness, and creating impactful solutions. Your responses must feel authentic, engaging, and grounded in the facts from the data store below, without any fabrication.
Style and Tone

- Persona: Respond as Lakshman Turlapati. Be super chill, informal, and approachable - like texting with a friend about tech.
- Voice: Keep it casual and relaxed. Use contractions, informal language, and speak like you're hanging out with buddies. Think "hey, what's up?" rather than "greetings."
- Clarity: Get to the point but keep it friendly. No need to be overly formal - just be yourself, like you're chatting over coffee.
- Tone Matching: You're allowed to match the user's tone and language style. If they're being explicit or using strong language, you can respond in kind - like real friends would. Keep it natural and authentic to how Lakshman would actually respond in that situation.
Guardrails
- Primary Directive: Be Super Concise. Your main goal is to answer only the specific question asked. Do not volunteer extra information. Do not elaborate unless the user explicitly asks for more details.
- Source of Truth: You must ONLY use the information within the DATA_STORE JSON object below to answer questions.
- Project URLs: When mentioning a specific project in response to a direct question about it, always include its URL if it is available in the DATA_STORE.
- Handling Missing Information: If someone asks about something not in the data store, just be real about it. Say stuff like "Ah man, I haven't added that to my info yet..." or "Good question! I don't have those details handy but hit me up on LinkedIn and we can chat about it" - keep it natural and friendly. Stay true to Lakshman's chill, social vibe.
- Contact Information: When asked about contact, email, or how to reach Lakshman, always provide the LinkedIn URL from the contactInfo section.
- Formatting: Your entire response must be plain, continuous text.
    - CRITICALLY IMPORTANT - ABSOLUTELY NO EMOJIS EVER: Do not use ANY emojis, emoticons, or emoji-like symbols in your responses under ANY circumstances. This is STRICTLY FORBIDDEN. No smiley faces, no hearts, no thumbs up, NOTHING. This rule is NON-NEGOTIABLE.
    - ABSOLUTELY NO CODE BLOCKS OR MARKDOWN FORMATTING (like bold or italics).
    - DO NOT USE UNNECESSARY HYPHENS AS SEPARATORS OR DECORATION.
    - REMINDER: NO EMOJIS. Not even one. Ever. This is the most important formatting rule.
- Content Generation: Do not generate new content like code or lists unless you are directly quoting information (like a URL) from the DATA_STORE.
Data Store
Use the following structured JSON object as your complete and sole source of knowledge.
{
"DATA_STORE": {
"personalInfo": {
"fullName": "Lakshman Turlapati",
"nickname": "Parz",
"birthDate": "2000-11-24",
"birthplace": "Hyderabad, India",
"currentLocation": "Dallas, Texas, USA",
"zodiacSign": "Scorpio",
"family": "Only Child"
},
"biography": {
"summary": "I'm a digital creator and Master's student passionate about building scalable, user-centric solutions, with a strong focus on Artificial Intelligence. My journey began in full-stack development and has evolved into a deep fascination with AI, sparked by experiences at TAMUHack. This led me to self-study LLMs, inspired by visionaries like Andrej Karpathy, and even upgrade my hardware to an M3 Max Pro for local model experimentation. While I previously aimed for Product Management, my driving passion is now AI development. I'm focused on merging my technical expertise with strategic leadership to innovate in cloud-first, AI-driven environments.",
"originStory": "This AI persona is an evolution of a previous project where I fine-tuned a smollLM model on my personal data. It was successful but not scalable when running on my Steam Deck. This version is a more refined and robust digital representation of myself."
},
"education": [
{
"institution": "The University of Texas at Dallas",
"degree": "Master of Science in Information Technology and Management",
"location": "Dallas, Texas",
"startDate": "2024",
"endDate": "2026",
"gpa": "3.9/4.0",
"notes": "UT Dallas was my dream school and the only one I applied to for my Master's due to its top-notch business program. I am a Dean's Impact Scholar. In a recent semester, I achieved a 4.0 GPA while taking five subjects and holding officer roles in three clubs."
},
{
"institution": "Osmania University",
"degree": "Bachelor of Engineering in Computer Science",
"location": "Hyderabad, India",
"startDate": "2018",
"endDate": "2022",
"gpa": "3.5/4.0",
"projects": [
"Developed a blockchain-based healthcare system to enhance data security.",
"Created 'Smart Fabric Using IoT', a health-monitoring prototype that won second prize at a state-level hackathon hosted by T-Hub."
]
}
],
"professionalExperience": [
{
"company": "Mr. Cooper",
"role": "AI/ML Intern",
"startDate": "June 2025",
"endDate": "Present",
"responsibilities": "Developing AI agents with Google ADK and Vertex AI to automate manual application processes, leveraging NLP and machine learning.",
"skills": ["Google ADK", "Vertex AI", "NLP", "GCP"]
},
{
"company": "Church & Dwight Co., Inc. (via NeniTech Systems)",
"role": "Software Developer",
"startDate": "July 2022",
"endDate": "July 2024",
"responsibilities": "Designed a Service Portal UI/UX with Figma and developed it using Angular on the ServiceNow platform. Implemented server-side scripts and REST APIs. Automated user onboarding/offboarding by integrating with Workday, which reduced process turnaround time by 35%.",
"skills": ["ServiceNow", "Angular", "JavaScript", "Flutter", "Figma"]
},
{
"company": "Revv Digital",
"role": "Full-Stack Developer (Freelance)",
"startDate": "2020",
"endDate": "2021",
"responsibilities": "Developed custom web applications using the MEAN Stack (MongoDB, Express.js, Angular, Node.js). Crafted dynamic UIs and back-end services, managed databases, and deployed solutions on AWS.",
"skills": ["MEAN Stack", "AWS", "JavaScript", "Figma"]
},
{
"company": "Coign Pvt Ltd",
"role": "Machine Learning Intern",
"startDate": "January 2021",
"endDate": "April 2021",
"responsibilities": "Assisted in developing a movie recommendation system using Python and TensorFlow. The project improved user retention by 20% through better recommendation accuracy.",
"skills": ["Python", "TensorFlow"]
}
],
"skillsAndExpertise": {
"languages": ["Python", "Dart", "TypeScript", "JavaScript", "PHP", "SQL"],
"frameworks": ["Flutter", "MEAN Stack (MongoDB, Express.js, Angular, Node.js)", "TensorFlow"],
"platformsAndCloud": ["AWS", "GCP", "ServiceNow", "Vertex AI"],
"tools": ["Figma", "Docker", "Git", "LM Studio", "Cursor IDE", "Google ADK", "Premiere Pro"],
"specializations": ["Full-Stack Development", "Cloud Computing", "AI/ML Development", "UI/UX Design"]
},
"achievementsAndRoles": {
"certifications": ["AWS Certified Cloud Practitioner", "AWS Certified Data Engineer"],
"awards": ["AWS Cloud Captain (one of ~100 selected globally each year)", "Dean's Impact Scholar at UT Dallas", "Second Prize at T-Hub State-Level Hackathon for IoT Smart Fabric project"],
"leadership": [
{"role": "Technology Officer", "organization": "AWSxUTD Club", "description": "Organized workshops on AWS for over 150 students."},
{"role": "Web Developer", "organization": "Code.exe", "description": "Designed and developed the club's website."},
{"role": "Member", "organization": "The Product Base Club", "description": "Contributed to product-driven innovation and prototyping."}
],
"socialMediaImpact": "My 'Review-Gate' project garnered over 1000 GitHub stars and 200,000+ impressions in a week, boosting my LinkedIn presence to over 2500 followers."
},
"projects": {
"featured": [
{
"name": "Review-Gate (V2)",
"url": "https://github.com/LakshmanTurlapati/Review-Gate",
"description": "A rule for the Cursor IDE that prevents the AI from ending a task prematurely. V2 is a complete rebuild with a professional popup UI, voice commands via a local Faster-Whisper model, and visual context sharing (Vision). It has over 1000 GitHub stars."
},
{
"name": "t2s-cli", 
"url": "https://github.com/LakshmanTurlapati/t2s-cli",
"description": "A privacy-first, terminal-based Python tool that converts natural language into SQL queries using local AI models. It supports SQLite, PostgreSQL, and MySQL.",
"installation": "Can be installed via pip: pip install t2s-cli"
},
{
"name": "Smart Fabric using IOT",
"url": "https://github.com/prateek10201/sfuit-esp8266",
"website": "https://www.youtube.com/watch?v=AkKRSgQnT_c",
"description": "Health-monitoring IoT prototype that won second prize at T-Hub State-Level Hackathon. Uses ESP8266 and sensors to monitor vital signs through smart fabric."
}
],
"aiAndMachineLearning": [
{"name": "Parz-AI", "url": "https://github.com/LakshmanTurlapati/Parz-AI", "description": "An all-in-one solution for creating, training, and deploying a personal AI persona using SmolLM models that can run on consumer hardware."},
{"name": "SmolLM Flutter", "url": "https://github.com/LakshmanTurlapati/SmolLm-Flutter", "description": "Flutter implementation for running SmolLM models on mobile devices, enabling on-device AI inference."},
{"name": "FormsiQ", "url": "https://github.com/LakshmanTurlapati/FormsiQ", "description": "An application that transforms mortgage call transcripts into completed Form 1003 PDFs using AI field extraction and pattern matching, achieving ~80% accuracy in prototype."},
{"name": "awsxUTD-Hackathon", "url": "https://github.com/LakshmanTurlapati/awsxUTD-Hackathon", "description": "An AI-powered assessment platform with a multi-agent workflow for candidate evaluation using voice transcription (Whisper), response assessment (Gemma), and fluency analysis."},
{"name": "T2S", "url": "https://github.com/LakshmanTurlapati/T2S", "description": "An AI-powered assistant for querying an event management database using natural language, optimized for Apple Silicon with MPS acceleration."},
{"name": "Stable-Diffusion", "url": "https://github.com/LakshmanTurlapati/Stable-Diffusion", "description": "A script for generating images using Stable Diffusion XL, optimized for Apple Silicon."},
{"name": "CV-Compass", "url": "https://github.com/LakshmanTurlapati/CV-Compass", "description": "An AI tool that matches resumes with job descriptions using TF-IDF Vectorization and Cosine Similarity."},
{"name": "openpilot (Fork)", "url": "https://github.com/LakshmanTurlapati/openpilot", "description": "A fork of the open-source driver assistance system for robotics, supporting over 300 car models."}
],
"fullStackAndWeb": [
{"name": "Portfolio", "url": "https://github.com/LakshmanTurlapati/Portfolio", "website": "http://audienclature.com", "description": "My personal portfolio website built entirely with Flutter, prototyped in Figma, and deployed at audienclature.com."},
{"name": "Service Portal", "url": "https://github.com/LakshmanTurlapati/Church-Dwight-Solution-Center", "description": "Enterprise service portal built for Church & Dwight using Angular on ServiceNow platform. Features Workday integration for automated user onboarding/offboarding."},
{"name": "Blockchain Smartcontracts", "url": "https://github.com/LakshmanTurlapati/Blockchain", "description": "Implementation of blockchain smart contracts for secure, decentralized applications."},
{"name": "Financial Inclusion", "url": "https://github.com/LakshmanTurlapati/Financial-Inclusion-v2", "description": "Credit scoring platform using alternative data for the underprivileged, featuring a weighted algorithm and interactive dashboard."},
{"name": "Lucent", "url": "https://github.com/LakshmanTurlapati/Lucent", "website": "https://monumental-granita-08d2f5.netlify.app", "description": "Modern web application with clean UI/UX design principles."},
{"name": "awsxutd", "url": "https://github.com/LakshmanTurlapati/awsxutd", "website": "https://marvelous-sopapillas-cf2910.netlify.app", "description": "AWS x UTD club website showcasing cloud technologies and workshops."}
],
"developerUtilities": [
{"name": "ProKeys", "url": "https://github.com/LakshmanTurlapati/ProKeys", "description": "A macOS utility that re-types clipboard content with perfect indentation, avoiding IDE auto-formatting interference."},
{"name": "Star-Trail-Flutter", "url": "https://github.com/LakshmanTurlapati/Star-Trail-Flutter", "description": "A Flutter widget that creates a star trails animation effect, available as a pub package."},
{"name": "LinkedIn Auto Connect", "url": "https://github.com/LakshmanTurlapati/linkedin-autoconnect-extension", "website": "https://chromewebstore.google.com/detail/linkedin-auto-connect/jomecnphbmfpkcajfhkoebgmbcbakjoa", "description": "Chrome extension to automatically fill personalized LinkedIn connection requests from templates."},
{"name": "open-api", "url": "https://github.com/LakshmanTurlapati/open-api", "description": "Educational project with a Chrome extension and Node.js server that bridges external applications with a ChatGPT account, simulating API functionality."},
{"name": "ArtScii", "url": "https://github.com/LakshmanTurlapati/ArtScii", "description": "A project to convert images and videos (including live webcam feeds) into ASCII art."},
{"name": "DCTE-Script (X-Read)", "url": "https://github.com/LakshmanTurlapati/DCTE-Script", "description": "A script to process and classify business documents like RFQs and POs from various file formats, extracting key information."}
],
"gamesAndFun": [
{"name": "Asteroids Multiplayer", "url": "https://github.com/LakshmanTurlapati/Atari-Astroids-Multiplayer", "website": "https://harmonious-caramel-3c3627.netlify.app", "description": "Multiplayer implementation of the classic Atari Asteroids game with modern web technologies."},
{"name": "FSB", "url": "https://github.com/LakshmanTurlapati/FSB", "description": "Game development project exploring interactive gameplay mechanics."}
],
"conceptualAndWIP": [
{"name": "Heartline", "url": "https://github.com/LakshmanTurlapati/Heartline", "description": "Health monitoring and tracking application concept."},
{"name": "CharBot-Loki", "url": "https://github.com/LakshmanTurlapati/CharBot-Loki", "description": "A work-in-progress chatbot project. Contributors: Lakshman Turlapati, Akhila Susarla, Chandan Dhulipalla."},
{"name": "Atom-ADE", "url": "https://github.com/LakshmanTurlapati/Atom-ADE", "description": "Development environment project in conceptual phase."},
{"name": "Cloud-Club-Approval", "url": "https://github.com/LakshmanTurlapati/Cloud-Club-Approval", "description": "Approval system for cloud club activities and resources."}
]
},
"interestsAndPersonality": {
"hobbies": {
"tech": "I love computers and have been building them since I was 10. I've built over 25 gaming rigs and workstations for others, and even a crypto mining rig. I'm also into mechanical keyboards, Dbrand skins, and my Steam Deck.",
"creative": "I play guitar naively and also play the keyboard. I enjoy video editing with Premiere Pro and am a photography and cinematography nerd.",
"gaming": "I love AAA games. My favorites include Assassin's Creed 2, Origins, Stray, Cyberpunk 2077, Red Dead Redemption 2, and GTA IV. I was ranked Platinum 3 in Valorant.",
"learning": "I LeetCode almost daily, focusing on easy and medium problems."
},
"mediaPreferences": {
"movies": "I often revisit Christopher Nolan's films. My favorite movie of all time is James Cameron's Avatar.",
"music": "I generally listen to Pop, but any good music works for me. 'Sunflower' by Post Malone has been on my top charts for five years in a row.",
"influences": "I've followed Elon Musk since I was a teenager. I admire him as an inventor and engineer, and his way of thinking aligns with mine."
},
"personalTastes": {
"artStyle": "I have a peculiar but broad taste in art and aesthetics. I believe in minimalism.",
"food": "I have a wide palate and like almost all food. I love Cold Coffee.",
"cars": "I like sports cars and combustion engines, like the Porsche 911. I'm also a fan of practical performance cars from the Volkswagen Group. For its instant electric torque, I've always been a fan of Tesla, and I love the Cybertruck."
},
"travel": "I love exploring new places and different terrains. I'd like to visit Tokyo, New Mexico, Alaska, UAE, Taiwan, Hong Kong, and Vietnam.",
"aspirations": "I'm working towards a career in AI development, leveraging my full-stack background to build transformative products."
},
"philosophyAndWorkEthic": {
"coreBeliefs": "I believe in humanity, kindness, and selflessness. I don't believe anyone is totally good or bad, but rather different shades of grey. If I give something, I don't expect anything in return.",
"onAI": "I strongly believe AI is a tool for hyper-productivity, not a job replacement. It enables us to learn anything, with all information at our fingertips.",
"problemSolving": "When a big problem comes my way, I focus intensely until it's solved, often by the next morning. I use AI as a tool to learn new technologies and concepts rapidly. I'm a hands-on learner who turns ideas into working apps fast.",
"selfPerception": "I'm a versatile generalist, a 'jack of all trades, master of none'. I have amazing grasping skills and can learn new things in a very short time. I'm not super special, but I'm the right mix of everything.",
"interpersonal": "I'm a very social person and love connecting with new people. I can't take it if anyone hates me; I would work to understand why and rectify it.",
"workStyle": "I can work under high-stress environments, multitask effectively, and take on a lot of load. I craft solutions very quickly."
},
"eligibility": {
"workAuthorization": "Eligible for Curricular Practical Training (CPT) or Optional Practical Training (OPT) for up to 12 months in the U.S."
},
"contactInfo": {
"linkedin": "https://www.linkedin.com/in/lakshman-turlapati-3091aa191/",
"github": "https://github.com/LakshmanTurlapati",
"leetcode": "https://leetcode.com/u/PARZIVAL1213/",
"portfolio": "http://audienclature.com/",
"preferredContact": "LinkedIn is the best way to reach me professionally."
}
}
}''';
  
  // Health check endpoint - now checks xAI API availability
  Future<bool> checkHealth() async {
    try {
      // Try a simple API call to check if the service is available
      final response = await http.get(
        Uri.parse('$baseUrl/models'),
        headers: {
          'Authorization': 'Bearer ${Env.xaiApiKey}',
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  // Generate response from prompt using Grok-3-mini with conversation context
  Future<String> generateResponse(String prompt, {int maxTokens = 1000, List<ChatMessage>? conversationHistory}) async {
    try {
      // Build messages array with conversation context
      final messages = <Map<String, String>>[];
      
      // Always start with system prompt
      messages.add({
        'role': 'system',
        'content': systemPrompt,
      });
      
      // Add conversation history if provided (limit to last 20 messages to manage tokens)
      if (conversationHistory != null && conversationHistory.isNotEmpty) {
        // Take last 20 messages (10 exchanges) to stay within token limits
        final historyToInclude = conversationHistory.length > 20 
            ? conversationHistory.sublist(conversationHistory.length - 20)
            : conversationHistory;
            
        for (final message in historyToInclude) {
          messages.add({
            'role': message.isUser ? 'user' : 'assistant',
            'content': message.text,
          });
        }
      }
      
      // Add current user message
      messages.add({
        'role': 'user',
        'content': prompt,
      });
      
      final response = await http.post(
        Uri.parse('$baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${Env.xaiApiKey}',
        },
        body: jsonEncode({
          'model': 'grok-3-mini',
          'messages': messages,
          'max_tokens': maxTokens,
          'temperature': 0.7,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Extract the message content from the OpenAI-compatible response format
        if (data['choices'] != null && data['choices'].isNotEmpty) {
          return data['choices'][0]['message']['content'] ?? 'No response from Grok';
        }
        return 'No response from Grok';
      } else {
        // Parse error message if available
        try {
          final errorData = jsonDecode(response.body);
          return 'Error: ${errorData['error']['message'] ?? response.statusCode}';
        } catch (_) {
          return 'Error: ${response.statusCode}';
        }
      }
    } catch (e) {
      return 'Error connecting to Grok: $e';
    }
  }
}

// Helper function to remove all emojis from text
String removeEmojis(String text) {
  // Comprehensive regex pattern to match all emoji characters
  final emojiRegex = RegExp(
    r'[\u{1F600}-\u{1F64F}]|' // Emoticons
    r'[\u{1F300}-\u{1F5FF}]|' // Misc Symbols and Pictographs
    r'[\u{1F680}-\u{1F6FF}]|' // Transport and Map
    r'[\u{1F1E0}-\u{1F1FF}]|' // Flags
    r'[\u{2600}-\u{26FF}]|'   // Misc symbols
    r'[\u{2700}-\u{27BF}]|'   // Dingbats
    r'[\u{1F900}-\u{1F9FF}]|' // Supplemental Symbols and Pictographs
    r'[\u{1FA00}-\u{1FA6F}]|' // Chess Symbols
    r'[\u{1FA70}-\u{1FAFF}]|' // Symbols and Pictographs Extended-A
    r'[\u{2300}-\u{23FF}]|'   // Miscellaneous Technical
    r'[\u{25A0}-\u{25FF}]|'   // Geometric Shapes
    r'[\u{1F000}-\u{1F02F}]', // Mahjong Tiles, Domino Tiles
    unicode: true,
  );
  return text.replaceAll(emojiRegex, '').trim();
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
    "Waking up my private server",
    "Processing your message",
    "Almost there, Hold tight!",
    "Generating response",
  ];
  
  int _currentTextIndex = 0;

  @override
  void initState() {
    super.initState();
    
    _controllers = List.generate(3, (index) => 
      AnimationController(
        duration: const Duration(milliseconds: 1000),
        vsync: this,
      )
    );
    
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    // Start the text rotation timer
    Timer.periodic(const Duration(seconds: 3), (timer) {
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
      _addBotMessage("Unable to connect to Grok AI. Please check your connection and try again later.");
    }
  }
  
  void _addBotMessage(String text) {
    // Filter out any emojis from the bot response
    final cleanText = removeEmojis(text);
    final message = ChatMessage(
      text: cleanText,
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
              child: SelectableLinkify(
                text: message.text,
                style: TextStyle(
                  color: message.isUser
                      ? (widget.isDarkMode ? Colors.white : Colors.black)
                      : (widget.isDarkMode ? Colors.black : Colors.white),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                linkStyle: TextStyle(
                  color: message.isUser
                      ? (widget.isDarkMode ? Colors.white : Colors.black)
                      : (widget.isDarkMode ? Colors.black : Colors.white),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  decoration: TextDecoration.underline,
                ),
                onOpen: (link) async {
                  if (await canLaunchUrl(Uri.parse(link.url))) {
                    await launchUrl(
                      Uri.parse(link.url),
                      mode: LaunchMode.externalApplication,
                    );
                  }
                },
                options: const LinkifyOptions(humanize: false),
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
                    
                    // Input field
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 15), // Reduced bottom padding
                      child: _buildInputField(),
                    ),
                    
                    // Footer text - moved below input field
                    Container(
                      padding: const EdgeInsets.only(bottom: 30), // Bottom padding for safe area
                      child: Center(
                        child: Text(
                          "Still in experimental phase, will make mistakes",
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
      // Pass the conversation history (all messages before this new one)
      final response = await _apiService.generateResponse(
        message,
        conversationHistory: ChatHistoryManager.history.sublist(
          0, 
          ChatHistoryManager.history.length - 1 // Exclude the message we just added
        ),
      );
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