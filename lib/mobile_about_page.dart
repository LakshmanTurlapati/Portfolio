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
                      text:
                          'I’m a digital creator with a passion for building scalable solutions that bridge technology and human needs. With expertise in ',
                    ),
                    TextSpan(
                      text: 'Full-stack',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ' development and a love for crafting seamless experiences using ',
                    ),
                    TextSpan(
                      text: 'Flutter, MEAN Stack, and AWS',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ', I’m all about turning ideas into impactful, user-centric applications.\n\n',
                    ),
                    const TextSpan(
                      text:
                          'My journey started with a Bachelor’s in ',
                    ),
                    TextSpan(
                      text: 'Computer Science',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ', where I led projects like a ',
                    ),
                    TextSpan(
                      text: 'blockchain',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          '-based healthcare system, ',
                    ),
                    TextSpan(
                      text: 'Smart Fabric Using IoT',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          '—a health-monitoring fabric prototype that won ',
                    ),
                    TextSpan(
                      text: 'second prize',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ' at a state-level hackathon hosted by ',
                    ),
                    TextSpan(
                      text: 'T-Hub',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ', the world’s largest incubation center. From developing a real-time booking system on AWS to designing a mobile-first portfolio site with Flutter, my work reflects my drive to innovate and adapt.\n\n',
                    ),
                    const TextSpan(
                      text:
                          'Now, as a Master’s student in ',
                    ),
                    TextSpan(
                      text: 'IT Management',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ' at ',
                    ),
                    TextSpan(
                      text: 'UT Dallas',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          '—my dream school—I’m sharpening my ability to merge tech expertise with strategic leadership. Fun fact: UT Dallas was the only school I applied to because of its top-notch business program and vibrant community!\n\n',
                    ),
                    TextSpan(
                      text: 'What’s next? ',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const TextSpan(
                      text:
                          'I aim to grow as a ',
                    ),
                    TextSpan(
                      text: 'Product Manager',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ', starting from the trenches of development to learn the ins and outs of building transformative products. As a ',
                    ),
                    TextSpan(
                      text: '2x AWS-certified',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const TextSpan(
                      text:
                          ' professional, I’m equipped with the skills and knowledge to lead in cloud-first environments. With a vision to lead and create, I’m here to challenge the status quo, one line of code (or one bold idea) at a time.',
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
                        'Master’s Degree · Information Technology and Management',
                    descriptions: [],
                    skills: [
                      'GPA: 3.77 / 4.0'
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
                        'Bachelor’s Degree · Computer Science',
                    descriptions: [],
                    skills: [
                      'GPA: 3.0 / 4.0'
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

class TimelineEntry extends StatelessWidget {
  final bool isDarkMode;
  final String timeline;
  final String title;
  final String companyOrInstitution;
  final List<String> descriptions;
  final List<String> skills;
  final bool isActive;
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
  Widget build(BuildContext context) {
    // Define active styles
    Color activeColor = isDarkMode
        ? Colors.grey.withOpacity(0.1)
        : Colors.black.withOpacity(0.05);

    Color borderColor = isDarkMode
        ? Colors.black.withOpacity(0.3)
        : Colors.white.withOpacity(0.3);

    double scale = isActive ? 1.05 : 1.0;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedScale(
        scale: scale,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: isActive ? activeColor : Colors.transparent,
            border: isActive
                ? Border.all(
                    color: borderColor,
                  )
                : null,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: isActive ? 10.0 : 0.0,
                sigmaY: isActive ? 10.0 : 0.0,
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
                        timeline,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDarkMode
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
                            title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color:
                                  isDarkMode ? Colors.black : Colors.white,
                              decoration: TextDecoration.none,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            companyOrInstitution,
                            style: TextStyle(
                              fontSize: 16,
                              color: isDarkMode
                                  ? Colors.black87
                                  : Colors.white70,
                            ),
                          ),
                          const SizedBox(height: 10),
                          // Descriptions
                          ...descriptions.map(
                            (description) => Padding(
                              padding: const EdgeInsets.only(bottom: 8.0),
                              child: Text(
                                description,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isDarkMode
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
                            children: skills.map((skill) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: isDarkMode
                                      ? const Color(0xFF3A3A3A)
                                      : const Color(0xFFF0F0F0),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  skill,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDarkMode
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