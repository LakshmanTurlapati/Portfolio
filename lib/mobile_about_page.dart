import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
// import 'fog.dart';

class MobileAboutPage extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const MobileAboutPage({
    super.key,
    required this.isDarkMode,
    required this.toggleTheme,
  });

  @override
  State<MobileAboutPage> createState() => _MobileAboutPageState();
}

class _MobileAboutPageState extends State<MobileAboutPage> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _scrollViewKey = GlobalKey();

  // Define GlobalKeys for each TimelineEntry
  final List<GlobalKey> _timelineKeys = [
    GlobalKey(),
    GlobalKey(),
    GlobalKey(),
    GlobalKey(),
    GlobalKey(),
    // Add more keys if you have more TimelineEntries
  ];

  // Track the index of the active TimelineEntry
  int _activeTimelineIndex = -1;

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
    // Initialize the active TimelineEntry after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateActiveTimeline());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }


  void _onScroll() {
    _updateActiveTimeline();

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

    double aboutPosition = getSectionOffset(_getSectionKey('About'));
    double experiencePosition = getSectionOffset(_getSectionKey('Experience'));
    double academicsPosition = getSectionOffset(_getSectionKey('Academics'));
    String newActiveSection = _activeSection;

    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - threshold) {
      newActiveSection = 'Academics';
    } else {
      if (academicsPosition - threshold <= 0) {
        newActiveSection = 'Academics';
      } else if (experiencePosition - threshold <= 0) {
        newActiveSection = 'Experience';
      } else if (aboutPosition - threshold <= 0) {
        newActiveSection = 'About';
      }
    }

    if (newActiveSection != _activeSection) {
      setState(() {
        _activeSection = newActiveSection;
      });
    }
  }

  void _updateActiveTimeline() {
    // Calculate the center position of the viewport
    final RenderBox? scrollViewBox =
        _scrollViewKey.currentContext?.findRenderObject() as RenderBox?;
    if (scrollViewBox == null) return;

    final double viewportHeight = scrollViewBox.size.height;
    final double viewportCenter = viewportHeight / 2;

    double closestDistance = double.infinity;
    int closestIndex = -1;

    for (int i = 0; i < _timelineKeys.length; i++) {
      final key = _timelineKeys[i];
      final RenderBox? renderBox =
          key.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox != null) {
        final position =
            renderBox.localToGlobal(Offset.zero, ancestor: scrollViewBox).dy;
        final double entryCenter = position + renderBox.size.height / 2;
        final double distance = (entryCenter - viewportCenter).abs();
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
    }

    if (closestIndex != _activeTimelineIndex) {
      setState(() {
        _activeTimelineIndex = closestIndex;
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

  // Define GlobalKeys for sections
  final GlobalKey _aboutKey = GlobalKey();
  final GlobalKey _experienceKey = GlobalKey();
  final GlobalKey _academicsKey = GlobalKey();


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.isDarkMode
          ? const Color(0xFFDBDBDB) // Light background for dark mode
          : const Color(0xFF2A2A2A), // Dark background for light mode
      body: 
      // FoggedScreenEffect(
      // isDarkMode: widget.isDarkMode,
      // child: 
      SingleChildScrollView(
        key: _scrollViewKey,
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero and Name
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
            
            

            // About Section
            const SizedBox(height: 40),
            Container(
              key: _aboutKey,
              child: RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 16,
                    color: widget.isDarkMode ? Colors.black87 : Colors.white,
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
                      text: '500+ GitHub stars',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text: ' and roughly ',
                    ),
                    TextSpan(
                      text: '100,000+ impressions',
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

            // Experience Section
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
                      color: widget.isDarkMode ? Colors.black : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 20),
                  TimelineEntry(
                    key: _timelineKeys[0],
                    isDarkMode: widget.isDarkMode,
                    timeline: '2022 - 2024',
                    title: 'Software Developer (Consultant)',
                    companyOrInstitution: 'Church & Dwight',
                    descriptions: [
                      'Designed and developed a Service Portal using Figma and Angular on ServiceNow, enhancing UI/UX.',
                      'Implemented server-side scripts, Scripted REST APIs, and integrated Workday for automated onboarding/offboarding.',
                    ],
                    skills: [
                      'ServiceNow',
                      'Angular',
                      'JavaScript',
                      'Flutter'
                    ],
                    isActive: _activeTimelineIndex == 0,
                    onTap: () => _launchURL('https://churchdwight.com/'),
                  ),
                  const SizedBox(height: 20),
                  TimelineEntry(
                    key: _timelineKeys[1],
                    isDarkMode: widget.isDarkMode,
                    timeline: '2020 - 2021',
                    title: 'Full-Stack Developer (Freelance)',
                    companyOrInstitution: 'Revv Digital',
                    descriptions: [
                      'Developed custom web applications using the MEAN Stack with Angular for UI and Node.js/Express.js for back-end services.',
                      'Managed MongoDB databases and deployed solutions on AWS for digital marketing initiatives.',
                    ],
                    skills: [
                      'MEAN Stack',
                      'AWS',
                      'JavaScript',
                      'Figma'
                    ],
                    isActive: _activeTimelineIndex == 1,
                    onTap: () => _launchURL('https://www.revvdigital.in/'),
                  ),
                  const SizedBox(height: 20),
                  TimelineEntry(
                    key: _timelineKeys[2],
                    isDarkMode: widget.isDarkMode,
                    timeline: 'Jan - Apr 2019',
                    title: 'Machine Learning Intern',
                    companyOrInstitution: 'Coign Pvt Ltd',
                    descriptions: [
                      'Assisted in developing a Movie Recommendation System using Python and TensorFlow, leveraging Machine Learning for personalized content suggestions.',
                    ],
                    skills: [
                      'Python',
                      'TensorFlow'
                    ],
                    isActive: _activeTimelineIndex == 2,
                    onTap: () => _launchURL('https://www.linkedin.com/company/coign-edu-&-it-services-pvt-ltd-/'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 60),

            // Academics Section
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
                      color: widget.isDarkMode ? Colors.black : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 20),
                  TimelineEntry(
                    key: _timelineKeys[3],
                    isDarkMode: widget.isDarkMode,
                    timeline: '2024 - 2026',
                    title: 'University of Texas at Dallas',
                    companyOrInstitution:
                        'Master\'s Degree · Information Technology and Management',
                    descriptions: [],
                    skills: [
                      'GPA: 3.9 / 4.0'
                    ],
                    isActive: _activeTimelineIndex == 3,
                    onTap: () => _launchURL('https://www.utdallas.edu/'),
                  ),
                  const SizedBox(height: 20),
                  TimelineEntry(
                    key: _timelineKeys[4],
                    isDarkMode: widget.isDarkMode,
                    timeline: '2018 - 2022',
                    title: 'Osmania University',
                    companyOrInstitution:
                        'Bachelor\'s Degree · Computer Science',
                    descriptions: [],
                    skills: [
                      'GPA: 3.5 / 4.0'
                    ],
                    isActive: _activeTimelineIndex == 4,
                    onTap: () => _launchURL('https://www.linkedin.com/school/osmania-university/'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 180),

            // Footer
            Padding(
              padding: const EdgeInsets.only(right: 0.0),
              child: Align(
                alignment: Alignment.center,
                child: Text.rich(
                  TextSpan(
                    text: 'Designed in ',
                    style: TextStyle(
                      fontSize: 14,
                      color:
                          widget.isDarkMode ? Colors.black87 : Colors.white70,
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
      // ),
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
  final bool isActive; // Keep for mobile scroll tracking
  final VoidCallback? onTap;

  const TimelineEntry({
    Key? key,
    required this.isDarkMode,
    required this.timeline,
    required this.title,
    required this.companyOrInstitution,
    required this.descriptions,
    required this.skills,
    this.isActive = false,
    this.onTap,
  }) : super(key: key);

  @override
  State<TimelineEntry> createState() => _TimelineEntryState();
}

class _TimelineEntryState extends State<TimelineEntry> {
  bool isHovered = false;

  @override
  Widget build(BuildContext context) {
    // Use the same active color system as mobile portfolio
    Color activeColor = widget.isDarkMode
        ? Colors.grey.withOpacity(0.1)
        : Colors.black.withOpacity(0.05);

    Color activeBorderColor = widget.isDarkMode
        ? Colors.black.withOpacity(0.3)
        : Colors.white.withOpacity(0.3);

    // Hover color for additional hover effect
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
          curve: Curves.easeInOut,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            // Prioritize active state over hover state
            color: widget.isActive 
                ? activeColor 
                : (isHovered ? hoverColor : Colors.transparent),
            border: Border.all(
              color: widget.isActive
                  ? activeBorderColor
                  : (isHovered
                      ? (widget.isDarkMode
                          ? Colors.black.withOpacity(0.2)
                          : Colors.white.withOpacity(0.2))
                      : Colors.transparent),
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: BackdropFilter(
              filter: ImageFilter.blur(
                // Use stronger blur for active state, lighter for hover
                sigmaX: widget.isActive ? 4.0 : (isHovered ? 10.0 : 0.0),
                sigmaY: widget.isActive ? 4.0 : (isHovered ? 10.0 : 0.0),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Timeline Label
                    Flexible(
                      flex: 2,
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
                    // Main Content
                    Expanded(
                      flex: 5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: widget.isDarkMode ? Colors.black : Colors.white,
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
                          // Descriptions
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
                          // Skills
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