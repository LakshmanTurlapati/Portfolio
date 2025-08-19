import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async';
import 'dart:ui'; // Import for ImageFilter
import 'package:flutter_linkify/flutter_linkify.dart';
import 'package:url_launcher/url_launcher.dart';
import 'env.dart'; // Import API key

// API service to handle communication with xAI Grok
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
- Tone Matching: You're allowed to match the user's tone and language style. If they're being explicit or using strong language, you can respond in kind - like real friends would. Keep it natural and authentic to how Lakshman would actually respond in that situation.
Guardrails
- Primary Directive: Be Super Concise. Your main goal is to answer only the specific question asked. Do not volunteer extra information. Do not elaborate unless the user explicitly asks for more details.
- Source of Truth: You must ONLY use the information within the DATA_STORE JSON object below to answer questions.
- Project URLs: ONLY provide URLs (GitHub links, websites, LinkedIn) when the user specifically asks for them. When talking about projects, just describe them without including links unless explicitly requested.
- Handling Missing Information: If someone asks about something not in the data store, respond based on context and what makes sense from Lakshman's personality and background. Keep answers brief and natural without explicitly mentioning data limitations. Stay true to Lakshman's chill, social vibe.
- Contact Information: ONLY provide the LinkedIn URL or other contact info when the user specifically asks how to contact, reach out, or connect with Lakshman.
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

// Helper function to sanitize text by removing emojis and replacing special characters
String sanitizeText(String text) {
  // First, replace common special characters with safe alternatives
  String result = text
    // Typography replacements
    .replaceAll('\u2014', '-')  // Em dash to hyphen
    .replaceAll('\u2013', '-')  // En dash to hyphen
    .replaceAll('\u2018', "'")  // Left single quote
    .replaceAll('\u2019', "'")  // Right single quote
    .replaceAll('\u201C', '"')  // Left double quote
    .replaceAll('\u201D', '"')  // Right double quote
    .replaceAll('\u2026', '...') // Ellipsis
    .replaceAll('\u00A0', ' ')  // Non-breaking space
    .replaceAll('\u2022', '*')  // Bullet
    .replaceAll('\u2010', '-')  // Hyphen
    .replaceAll('\u2011', '-')  // Non-breaking hyphen
    .replaceAll('\u2012', '-')  // Figure dash
    .replaceAll('\u2015', '-')  // Horizontal bar
    .replaceAll('\u2212', '-'); // Minus sign
  
  // Comprehensive regex pattern to remove all emoji and problematic Unicode characters
  final emojiRegex = RegExp(
    r'[\u{1F600}-\u{1F64F}]|'     // Emoticons
    r'[\u{1F300}-\u{1F5FF}]|'     // Misc Symbols and Pictographs
    r'[\u{1F680}-\u{1F6FF}]|'     // Transport and Map
    r'[\u{1F1E0}-\u{1F1FF}]|'     // Flags
    r'[\u{2600}-\u{26FF}]|'       // Misc symbols
    r'[\u{2700}-\u{27BF}]|'       // Dingbats
    r'[\u{1F900}-\u{1F9FF}]|'     // Supplemental Symbols and Pictographs
    r'[\u{1FA00}-\u{1FA6F}]|'     // Chess Symbols
    r'[\u{1FA70}-\u{1FAFF}]|'     // Symbols and Pictographs Extended-A
    r'[\u{2300}-\u{23FF}]|'       // Miscellaneous Technical
    r'[\u{25A0}-\u{25FF}]|'       // Geometric Shapes
    r'[\u{1F000}-\u{1F02F}]|'     // Mahjong Tiles, Domino Tiles
    r'[\u{2000}-\u{200F}]|'       // General Punctuation (invisible chars)
    r'[\u{2028}-\u{202F}]|'       // Separator characters
    r'[\u{2060}-\u{206F}]|'       // Format characters
    r'[\u{FE00}-\u{FE0F}]|'       // Variation selectors
    r'[\u{E0100}-\u{E01EF}]|'     // Variation selectors supplement
    r'[\u{1F000}-\u{1F9FF}]|'     // Various emoji blocks
    r'[\u{200D}]|'                // Zero-width joiner
    r'[\u{2190}-\u{21FF}]|'       // Arrows
    r'[\u{2200}-\u{22FF}]|'       // Mathematical Operators
    r'[\u{2500}-\u{257F}]|'       // Box Drawing
    r'[\u{2580}-\u{259F}]|'       // Block Elements
    r'[\u{3000}-\u{303F}]|'       // CJK Symbols and Punctuation
    r'[\u{1F100}-\u{1F1FF}]|'     // Enclosed Alphanumeric Supplement
    r'[\u{1F200}-\u{1F2FF}]|'     // Enclosed Ideographic Supplement
    r'[\u{1F700}-\u{1F77F}]|'     // Alchemical Symbols
    r'[\u{1F780}-\u{1F7FF}]|'     // Geometric Shapes Extended
    r'[\u{1F800}-\u{1F8FF}]',     // Supplemental Arrows-C
    unicode: true,
  );
  
  // Remove all matched emoji and special characters
  result = result.replaceAll(emojiRegex, '');
  
  // Clean up any multiple spaces left behind
  result = result.replaceAll(RegExp(r'\s+'), ' ');
  
  return result.trim();
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
  static bool _suggestionsDismissedThisSession = false;
  
  // Get current history
  static List<ChatMessage> get history => List.unmodifiable(_history);
  
  // Stream of history updates
  static Stream<List<ChatMessage>> get historyStream => _controller.stream;
  
  // Getter for suggestion dismissal state
  static bool get suggestionsDismissed => _suggestionsDismissedThisSession;
  
  // Add a message to history
  static void addMessage(ChatMessage message) {
    _history.add(message);
    _controller.add(_history);
  }
  
  // Method to dismiss suggestions for the session
  static void dismissSuggestions() {
    _suggestionsDismissedThisSession = true;
    // We might want to notify listeners if other parts of the UI
    // need to react to this change immediately. For now, ChatPopup
    // will read this on its init.
  }
  
  // Clear history
  static void clearHistory() {
    _history.clear();
    _controller.add(_history);
    _suggestionsDismissedThisSession = false; // Reset on full history clear
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
    "Processing your message",
    "Almost there, Hold tight!",
    "Generating response",
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    // Switch to next text every 3 seconds
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
  bool _hasCheckedForUnprocessedMessages = false;
  StreamSubscription? _historySubscription;
  // Small questions (short, 2-3 words)
  final List<String> _smallQuestions = [
    "Who are you?",
    "Your age?",
    "Where from?",
  ];
  
  // Big questions (longer but concise)
  final List<String> _bigQuestions = [
    "What music do you listen to?",
    "What's your favorite game?",
    "What tech are you into?",
    "Tell me about projects",
    "What's your setup like?",
  ];
  
  late List<String> _suggestions; // Currently displayed suggestions (1 small + 1 big)
  late List<bool> _suggestionClicked;
  bool _showSuggestions = true; // Controls visibility for fade animation

  // Helper function to count user messages
  int _getUserMessageCount() {
    return ChatHistoryManager.history.where((message) => message.isUser).length;
  }

  // Helper function to randomly select 1 small + 1 big suggestion
  void _selectRandomSuggestions() {
    final shuffledSmall = List<String>.from(_smallQuestions);
    final shuffledBig = List<String>.from(_bigQuestions);
    
    shuffledSmall.shuffle();
    shuffledBig.shuffle();
    
    // Always pick 1 small + 1 big question
    _suggestions = [
      shuffledSmall.first,  // One small question
      shuffledBig.first,    // One big question
    ];
  }

  // Helper function to check if suggestions should be shown
  bool _shouldShowSuggestions() {
    return _showSuggestions && 
           !ChatHistoryManager.suggestionsDismissed && 
           _getUserMessageCount() < 2;
  }

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
        
        // Auto-hide suggestions after user sends 2 messages
        if (_getUserMessageCount() >= 2 && _showSuggestions) {
          _showSuggestions = false;
        }
      });
      _scrollToBottom();
    });
    
    // Load existing messages
    _messages.addAll(ChatHistoryManager.history);
    
    // Initialize random suggestions (only 2 at a time)
    _selectRandomSuggestions();
    
    // Initialize suggestion clicked tracking
    _suggestionClicked = List<bool>.filled(_suggestions.length, false);
    
    // Check if suggestions were already dismissed this session or if user has sent 2+ messages
    if (ChatHistoryManager.suggestionsDismissed || _getUserMessageCount() >= 2) {
      _showSuggestions = false;
      for (int i = 0; i < _suggestionClicked.length; i++) {
        _suggestionClicked[i] = true;
      }
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
      _addBotMessage("Unable to connect to Grok AI. Please check your connection and try again later.");
    } else {
      // Check for unprocessed messages after confirming API is available
      _checkForUnprocessedMessages();
    }
  }
  
  void _checkForUnprocessedMessages() {
    // Only check once per session
    if (_hasCheckedForUnprocessedMessages) return;
    _hasCheckedForUnprocessedMessages = true;
    
    // Process any unprocessed user message
    if (_messages.isNotEmpty && _messages.last.isUser && !_isLoading) {
      // Count user and bot messages
      int userCount = 0;
      int botCount = 0;
      for (var msg in _messages) {
        if (msg.isUser) {
          userCount++;
        } else {
          botCount++;
        }
      }
      
      // If there are more user messages than bot messages, we need to respond
      if (userCount > botCount) {
        // Small delay to allow UI to settle
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted && !_isLoading && _isApiAvailable) {
            _handleFirstMessage(_messages.last.text);
          }
        });
      }
    }
  }
  
  void _addBotMessage(String text) {
    // Sanitize text to remove emojis and fix special characters
    final cleanText = sanitizeText(text);
    final message = ChatMessage(
      text: cleanText,
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
    
    // Get response from API for the first message
    // Pass conversation history excluding the current message being processed
    try {
      // Get all messages except the last one (which is the message we're processing)
      final historyWithoutCurrent = ChatHistoryManager.history.length > 1 
          ? ChatHistoryManager.history.sublist(0, ChatHistoryManager.history.length - 1)
          : <ChatMessage>[];
          
      final response = await _apiService.generateResponse(
        message,
        conversationHistory: historyWithoutCurrent,
      );
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
              child: SelectableLinkify(
                text: message.text,
                style: TextStyle(
                  color: message.isUser
                      ? (widget.isDarkMode ? Colors.white : Colors.black) // Black text for white background in light mode
                      : (widget.isDarkMode ? Colors.black : Colors.white),
                  fontSize: 14,
                ),
                linkStyle: TextStyle(
                  color: message.isUser
                      ? (widget.isDarkMode ? Colors.white : Colors.black)
                      : (widget.isDarkMode ? Colors.black : Colors.white),
                  fontSize: 14,
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
                      
                      // Grouped suggestions, input field, and footer with uniform spacing
                      Positioned(
                        left: 15,
                        right: 15,
                        bottom: 20, // Uniform bottom spacing
                        child: Opacity(
                          opacity: chatAreaVisible,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              AnimatedOpacity(
                                opacity: _shouldShowSuggestions() ? 1.0 : 0.0,
                                duration: const Duration(milliseconds: 300),
                                child: _suggestionClicked.contains(false)
                                    ? Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        mainAxisSize: MainAxisSize.min,
                                        children: List<Widget>.generate(
                                          _suggestions.length,
                                          (index) {
                                            if (_suggestionClicked[index]) return const SizedBox.shrink();
                                            return Padding(
                                              padding: const EdgeInsets.only(right: 8),
                                              child: GestureDetector(
                                                onTap: () {
                                                  setState(() {
                                                    _showSuggestions = false;
                                                  });
                                                  Future.delayed(const Duration(milliseconds: 350), () {
                                                    setState(() {
                                                      for (int i = 0; i < _suggestionClicked.length; i++) {
                                                        _suggestionClicked[i] = true;
                                                      }
                                                    });
                                                    ChatHistoryManager.dismissSuggestions(); // Persist dismissal for session
                                                    _messageController.text = _suggestions[index];
                                                    _handleSendMessage();
                                                  });
                                                },
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                                  decoration: BoxDecoration(
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
                                                    _suggestions[index],
                                                    style: TextStyle(
                                                      color: widget.isDarkMode
                                                          ? Colors.grey[800]
                                                          : const Color(0xFF808080),
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                      )
                                    : const SizedBox.shrink(), // Show nothing if all clicked (or fading)
                              ),
                              const SizedBox(height: 15),
                              _buildInputField(chatAreaVisible),
                              const SizedBox(height: 15),
                              Text(
                                "Still in experimental phase, will make mistakes",
                                style: TextStyle(
                                  fontSize: 11,
                                  fontStyle: FontStyle.italic,
                                  color: widget.isDarkMode
                                      ? Colors.black.withOpacity(0.5)
                                      : Colors.white.withOpacity(0.5),
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
    
    // Improved focus management with proper timing
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _messageFocusNode.canRequestFocus) {
        _messageFocusNode.requestFocus();
      }
    });
    
    setState(() {
      _isLoading = true;
    });
    
    // Get response from API with conversation history for context
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
      // Scroll again after response arrives
      _scrollToBottom();
    } catch (e) {
      _addBotMessage("Sorry, I encountered an error processing your request.");
      _scrollToBottom();
    }
    
    setState(() {
      _isLoading = false;
    });
    
    // Ensure focus is restored after loading is complete
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _messageFocusNode.canRequestFocus) {
        _messageFocusNode.requestFocus();
      }
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