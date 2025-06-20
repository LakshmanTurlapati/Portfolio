import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart'; 
import 'spotlight.dart';
import 'mobile_about_page.dart';

class AboutPage extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const AboutPage({
    super.key,
    required this.isDarkMode,
    required this.toggleTheme,
  });

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _aboutKey = GlobalKey();
  final GlobalKey _experienceKey = GlobalKey();
  final GlobalKey _academicsKey = GlobalKey();
  final GlobalKey _scrollViewKey = GlobalKey();

  String _activeSection = 'About';

  Future<void> _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToSection(GlobalKey key) {
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        alignment: 0.1, 
      );
    }
  }

  void _onScroll() {
    const double threshold = 40.0; 

    final RenderBox? scrollViewBox =
        _scrollViewKey.currentContext?.findRenderObject() as RenderBox?;

    if (scrollViewBox == null) return;

    double getSectionOffset(GlobalKey key) {
      final RenderBox? renderBox =
          key.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox == null) return double.infinity;
      return renderBox.localToGlobal(Offset.zero, ancestor: scrollViewBox).dy;
    }

    double aboutPosition = getSectionOffset(_aboutKey);
    double experiencePosition = getSectionOffset(_experienceKey);
    double academicsPosition = getSectionOffset(_academicsKey);
    String newActiveSection = _activeSection;

    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - threshold) {
      newActiveSection = 'Academics';
    } else {
      if (academicsPosition - threshold <= 0) {
        newActiveSection = 'Academics';
      }
      else if (experiencePosition - threshold <= 0) {
        newActiveSection = 'Experience';
      }
      else if (aboutPosition - threshold <= 0) {
        newActiveSection = 'About';
      }
    }

    if (newActiveSection != _activeSection) {
      setState(() {
        _activeSection = newActiveSection;
      });
    }
  }

  GlobalKey _getSectionKey(String section) {
    switch (section) {
      case 'About':
        return _aboutKey;
      case 'Experience':
        return _experienceKey;
      case 'Academics':
        return _academicsKey;
      default:
        return _aboutKey;
    }
  }

  Widget _buildNavLink(String title, String section) {
    bool isActive = _activeSection == section;
    return GestureDetector(
      onTap: () {
        _scrollToSection(_getSectionKey(section));
      },
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: isActive ? 60.0 : 30.0,
            height: 2.0,
            color: isActive
                ? (widget.isDarkMode ? Colors.black : Colors.white)
                : (widget.isDarkMode
                    ? Colors.black.withOpacity(0.6)
                    : Colors.white.withOpacity(0.6)),
          ),
          const SizedBox(width: 8.0),
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 300),
            style: TextStyle(
              fontSize: isActive ? 18.0 : 16.0,
              fontWeight: FontWeight.bold,
              color: isActive
                  ? (widget.isDarkMode ? Colors.black : Colors.white)
                  : (widget.isDarkMode
                      ? Colors.black.withOpacity(0.6)
                      : Colors.white.withOpacity(0.6)),
            ),
            child: Text(title),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // >>> ADDED CHECK: if width < 600, use the mobile version. <<<
    if (MediaQuery.of(context).size.width < 600) {
      return MobileAboutPage(
        isDarkMode: widget.isDarkMode,
        toggleTheme: widget.toggleTheme,
      );
    }

    // Otherwise, show the original (desktop) version
    return Scaffold(
      backgroundColor: widget.isDarkMode
          ? const Color(0xFFDBDBDB) // Light background for dark mode
          : const Color(0xFF2A2A2A), // Dark background for light mode
      body: SpotlightEffect(
        isDarkMode: widget.isDarkMode,
        child: NotificationListener<ScrollNotification>(
          onNotification: (notification) => true, // Consume all scroll notifications
          child: Listener(
            onPointerSignal: (pointerSignal) {
              if (pointerSignal is PointerScrollEvent) {
                // Capture scroll events anywhere on the page
                if (_scrollController.hasClients) {
                  final delta = pointerSignal.scrollDelta.dy;
                  final currentOffset = _scrollController.offset;
                  final maxOffset = _scrollController.position.maxScrollExtent;
                  final newOffset = (currentOffset + delta).clamp(0.0, maxOffset);
                  
                  _scrollController.jumpTo(newOffset);
                }
              }
            },
            child: Row(
              children: [
                // Fixed Sidebar - completely static
                SizedBox(
                  width: MediaQuery.of(context).size.width * 0.4,
                  height: MediaQuery.of(context).size.height,
                  child: Container(
                    color: widget.isDarkMode
                        ? const Color(0xFFDBDBDB)
                        : const Color(0xFF2A2A2A),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Hero(
                          tag: 'portfolioButtonHero',
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: widget.isDarkMode ? Colors.black : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: IconButton(
                              icon: Icon(
                                Icons.arrow_back,
                                color: widget.isDarkMode ? Colors.white : Colors.black,
                              ),
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'Venkat L. Turlapati',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: widget.isDarkMode ? Colors.black : Colors.white,
                          ),
                        ),
                        const SizedBox(height: 40),
                        // Navigation Links
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildNavLink('About', 'About'),
                            const SizedBox(height: 24.0),
                            _buildNavLink('Experience', 'Experience'),
                            const SizedBox(height: 24.0),
                            _buildNavLink('Academics', 'Academics'),
                          ],
                        ),
                        const Spacer(),
                        // Social Links
                        Padding(
                          padding: const EdgeInsets.only(left: 0.0, bottom: 0.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              IconButton(
                                icon: const FaIcon(FontAwesomeIcons.github),
                                color: widget.isDarkMode
                                    ? Colors.grey[800]
                                    : const Color(0xFF808080),
                                onPressed: () async {
                                  const url = 'https://github.com/LakshmanTurlapati';
                                  if (await canLaunchUrl(Uri.parse(url))) {
                                    await launchUrl(Uri.parse(url));
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Could not launch $url')),
                                    );
                                  }
                                },
                              ),
                              IconButton(
                                icon: const FaIcon(FontAwesomeIcons.linkedin),
                                color: widget.isDarkMode
                                    ? Colors.grey[800]
                                    : const Color(0xFF808080),
                                onPressed: () async {
                                  const url =
                                      'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/';
                                  if (await canLaunchUrl(Uri.parse(url))) {
                                    await launchUrl(Uri.parse(url));
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Could not launch $url')),
                                    );
                                  }
                                },
                              ),
                              IconButton(
                                icon: const FaIcon(FontAwesomeIcons.twitter),
                                color: widget.isDarkMode
                                    ? Colors.grey[800]
                                    : const Color(0xFF808080),
                                onPressed: () async {
                                  const url = 'https://x.com/parzival1213';
                                  if (await canLaunchUrl(Uri.parse(url))) {
                                    await launchUrl(Uri.parse(url));
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Could not launch $url')),
                                    );
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Scrollable Right Content
                Expanded(
                  child: SingleChildScrollView(
                    key: _scrollViewKey,
                    controller: _scrollController,
                    physics: const NeverScrollableScrollPhysics(), // Disable direct scrolling
                    padding: const EdgeInsets.symmetric(horizontal: 120),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 70),
                        Container(
                          key: _aboutKey,
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(
                                fontSize: 16,
                                color: widget.isDarkMode
                                    ? Colors.black87
                                    : Colors.white,
                                height: 1.5,
                              ),
                              children: [
                                const TextSpan(
                                  text: 'I\'m a digital creator passionate about building scalable solutions that bridge technology and human needs, and I\'m all about turning ideas into impactful, user-centric applications. My journey, rooted in ',
                                ),
                                TextSpan(
                                  text: 'Full-stack',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' development, has taken a thrilling turn towards ',
                                ),
                                TextSpan(
                                  text: 'Artificial Intelligence',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ', a field that has utterly captivated me.\n\n',
                                ),
                                const TextSpan(
                                  text: 'This new direction was sparked at ',
                                ),
                                TextSpan(
                                  text: 'TAMUHack',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: '. Witnessing the sheer power of AI in so many projects was a revelation. It led to an intense period of self-immersion: devouring everything on ',
                                ),
                                TextSpan(
                                  text: 'LLMs and transformers',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' (inspired by visionaries like ',
                                ),
                                TextSpan(
                                  text: 'Andrej Karpathy',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: '), exploring ',
                                ),
                                TextSpan(
                                  text: 'Hugging Face',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ', and even upgrading my MacBook from ',
                                ),
                                TextSpan(
                                  text: 'M2 Air to an M3 Max Pro',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' (Let me tell you it was not light on the pocket) to fuel my experimenting with large language models locally\n\n',
                                ),
                                const TextSpan(
                                  text: 'Currently, I\'m sharpening my ability to merge tech expertise with strategic leadership as a Master\'s student in ',
                                ),
                                TextSpan(
                                  text: 'IT Management',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' at ',
                                ),
                                TextSpan(
                                  text: 'UT Dallas',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: '—my dream school! Fun fact: UT Dallas was the only school I applied to because of its top-notch business program and vibrant community! Even with a demanding schedule of five subjects and technical officer roles in the ',
                                ),
                                TextSpan(
                                  text: 'AWS, Code.exe, and Product Base',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' clubs, I achieved a ',
                                ),
                                TextSpan(
                                  text: '4.0 GPA',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' in my recent semester, all while actively developing AI projects. While I once aimed for Product Management, ',
                                ),
                                TextSpan(
                                  text: 'AI development',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' is now my driving passion. As a ',
                                ),
                                TextSpan(
                                  text: '2x AWS-certified',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' professional and, I\'m incredibly honored to say, an ',
                                ),
                                TextSpan(
                                  text: 'AWS Cloud Captain',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' (one of only ~100 selected globally each year), I\'m equipped to innovate in cloud-first, AI-driven environments.\n\n',
                                ),
                                const TextSpan(
                                  text: 'I\'ve since created numerous ',
                                ),
                                TextSpan(
                                  text: 'multi-agentic workflows',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ', and the "',
                                ),
                                TextSpan(
                                  text: 'Review-Gate',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: '" project for the ',
                                ),
                                TextSpan(
                                  text: 'Cursor IDE',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ', which has garnered over ',
                                ),
                                TextSpan(
                                  text: '1000+ GitHub stars',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' and roughly ',
                                ),
                                TextSpan(
                                  text: '200,000+ impressions',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' within a week!. This work has not only boosted my LinkedIn presence (around ',
                                ),
                                TextSpan(
                                  text: '2,500+ followers',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ' and significant engagement) but has also opened doors to exciting professional opportunities.\n\n',
                                ),
                                const TextSpan(
                                  text: 'I\'m deeply grateful for this journey and believe I\'m in the right place at the right time. My heart is set on ',
                                ),
                                TextSpan(
                                  text: 'AI development',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(
                                  text: ', and I\'m excited to keep challenging the status quo, one line of code (or one bold AI idea) at a time.',
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 40), 
                        Container(
                          key: _experienceKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Experience',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: widget.isDarkMode
                                      ? Colors.black
                                      : Colors.white,
                                ),
                              ),
                              const SizedBox(height: 20),
                              TimelineEntry(
                                isDarkMode: widget.isDarkMode,
                                timeline: 'June 2025 - Present',
                                title: 'AI/ML Intern',
                                companyOrInstitution: 'Mr. Cooper',
                                descriptions: [
                                  'Developing AI agents with Google ADK and Vertex AI to automate manual application processes, leveraging NLP and machine learning for efficient, user-friendly solutions.',
                                ],
                                skills: [
                                  'Google ADK',
                                  'Vertex AI',
                                  'NLP',
                                  'GCP'
                                ],
                                onTap: () => _launchURL('https://www.linkedin.com/company/mrcoopermortgage/posts/?feedView=all'),
                              ),
                              const SizedBox(height: 20),
                              TimelineEntry(
                                isDarkMode: widget.isDarkMode,
                                timeline: '2022 - 2024',
                                title: 'Software Developer',
                                companyOrInstitution: 'Church & Dwight',
                                descriptions: [
                                  'Designed and developed a Service Portal using Figma for UI design and Angular on the ServiceNow platform, focusing on improving its user interface and experience.',
                                  'Implemented solutions using server-side scripts like Business Rules and Script Includes, created Scripted REST APIs, and integrated Workday to automate user onboarding and off-boarding processes.',
                                ],
                                skills: [
                                  'ServiceNow',
                                  'Angular',
                                  'JavaScript',
                                  'Flutter'
                                ],
                                onTap: () => _launchURL('https://churchdwight.com/'),
                              ),
                              const SizedBox(height: 20),
                              TimelineEntry(
                                isDarkMode: widget.isDarkMode,
                                timeline: '2020 - 2021',
                                title: 'Full-Stack Developer (Freelance)',
                                companyOrInstitution: 'Revv Digital',
                                descriptions: [
                                  'Developed custom web applications using the MEAN Stack, crafting dynamic user interfaces with Angular and back-end services with Node.js and Express.js.',
                                  'Database management with MongoDB and deployed solutions on AWS to digital marketing initiatives.',
                                ],
                                skills: [
                                  'MEAN Stack',
                                  'AWS',
                                  'JavaScript',
                                  'Figma'
                                ],
                                onTap: () => _launchURL('https://www.revvdigital.in/'),
                              ),
                              const SizedBox(height: 20),
                              TimelineEntry(
                                isDarkMode: widget.isDarkMode,
                                timeline: 'Jan - Apr 2019',
                                title: 'Machine Learning Intern',
                                companyOrInstitution: 'Coign Pvt Ltd',
                                descriptions: [
                                  'Assisted in developing a Movie Recommendation System for a streaming service, learning to use Machine Learning techniques with Python and TensorFlow for model training and data processing to deliver personalized content suggestions.',
                                ],
                                skills: [
                                  'Python',
                                  'TensorFlow'
                                ],
                                onTap: () => _launchURL('https://www.linkedin.com/company/coign-edu-&-it-services-pvt-ltd-/'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 60), 
                        Container(
                          key: _academicsKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Academics',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: widget.isDarkMode
                                      ? Colors.black
                                      : Colors.white,
                                ),
                              ),
                              const SizedBox(height: 20),
                              TimelineEntry(
                                isDarkMode: widget.isDarkMode,
                                timeline: '2024 - 2026',
                                title: 'University of Texas at Dallas',
                                companyOrInstitution:
                                    'Master\'s Degree · Information Technology and Management',
                                descriptions: [],
                                skills: [
                                  'GPA: 3.9 / 4.0'
                                ],
                                onTap: () => _launchURL('https://www.utdallas.edu/'),
                              ),
                              const SizedBox(height: 20),
                              TimelineEntry(
                                isDarkMode: widget.isDarkMode,
                                timeline: '2018 - 2022',
                                title: 'Osmania University',
                                companyOrInstitution:
                                    'Bachelor\'s Degree · Computer Science',
                                descriptions: [],
                                skills: [
                                  'GPA: 3.5 / 4.0'
                                ],
                                onTap: () => _launchURL('https://www.linkedin.com/school/osmania-university/'),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 180), 
                        Padding(
                          padding: const EdgeInsets.only(right: 200.0),
                          child: Align(
                            alignment: Alignment.center,
                            child: Text.rich(
                              TextSpan(
                                text: 'Designed in ',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: widget.isDarkMode ? Colors.black87 : Colors.white70,
                                  height: 1.5,
                                ),
                                children: [
                                  TextSpan(
                                    text: 'Figma',
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  TextSpan(text: ', coded in '),
                                  TextSpan(
                                    text: 'Flutter',
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  TextSpan(text: ' (because why not?), and deployed on '),
                                  TextSpan(
                                    text: 'AWS',
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  TextSpan(text: '. Inter typeface ties it all together.'),
                                ],
                              ),
                              textAlign: TextAlign.left,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
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
}

class TimelineEntry extends StatefulWidget {
  final bool isDarkMode;
  final String timeline;
  final String title;
  final String companyOrInstitution;
  final List<String> descriptions;
  final List<String> skills;
  final VoidCallback? onTap; 

  const TimelineEntry({
    Key? key,
    required this.isDarkMode,
    required this.timeline,
    required this.title,
    required this.companyOrInstitution,
    required this.descriptions,
    required this.skills,
    this.onTap,
  }) : super(key: key);

  @override
  State<TimelineEntry> createState() => _TimelineEntryState();
}

class _TimelineEntryState extends State<TimelineEntry> {
  bool isHovered = false;

  @override
  Widget build(BuildContext context) {
    Color hoverColor = widget.isDarkMode
        ? Colors.grey.withOpacity(0.05) 
        : Colors.black.withOpacity(0.05);

    return MouseRegion(
      cursor: widget.onTap != null
          ? SystemMouseCursors.click
          : MouseCursor.defer,
      onEnter: (_) => setState(() => isHovered = true),
      onExit: (_) => setState(() => isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: isHovered ? hoverColor : Colors.transparent,
            border: Border.all(
              color: isHovered
                  ? (widget.isDarkMode
                      ? Colors.black.withOpacity(0.2)
                      : Colors.white.withOpacity(0.2))
                  : Colors.transparent,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: isHovered ? 10.0 : 0.0,
                sigmaY: isHovered ? 10.0 : 0.0,
              ),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12.0, right: 12.0, top: 12.0, left: 12.0), // Added right padding
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.1,
                      child: Text(
                        widget.timeline,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: widget.isDarkMode
                              ? Colors.black.withOpacity(0.6)
                              : Colors.white.withOpacity(0.6),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: widget.isDarkMode
                                  ? Colors.black
                                  : Colors.white,
                              decoration: TextDecoration.none, 
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.companyOrInstitution,
                            style: TextStyle(
                              fontSize: 16,
                              color: widget.isDarkMode
                                  ? Colors.black87
                                  : Colors.white70,
                            ),
                          ),
                          const SizedBox(height: 10),
                          ...widget.descriptions.map(
                            (description) => Padding(
                              padding: const EdgeInsets.only(bottom: 8.0),
                              child: Text(
                                description,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: widget.isDarkMode
                                      ? Colors.black87
                                      : Colors.white70,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: widget.skills.map((skill) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: widget.isDarkMode
                                      ? const Color(0xFF3A3A3A)
                                      : const Color(0xFFF0F0F0),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  skill,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: widget.isDarkMode
                                        ? Colors.white
                                        : Colors.black87,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}