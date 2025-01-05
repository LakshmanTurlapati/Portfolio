import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/gestures.dart'; // Required for TapGestureRecognizer

class AboutPage extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const AboutPage({
    Key? key,
    required this.isDarkMode,
    required this.toggleTheme,
  }) : super(key: key);

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  // ScrollController to control the scrolling
  final ScrollController _scrollController = ScrollController();

  // GlobalKeys for each section
  final GlobalKey _aboutKey = GlobalKey();
  final GlobalKey _experienceKey = GlobalKey();
  final GlobalKey _academicsKey = GlobalKey();

  // GlobalKey for the SingleChildScrollView
  final GlobalKey _scrollViewKey = GlobalKey();

  // Current active section
  String _activeSection = 'About';

  // Function to launch URLs (used in other sections)
  Future<void> _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      // Could not launch URL
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  @override
  void initState() {
    super.initState();

    // Listen to scroll events to update active section
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    // Dispose ScrollController
    _scrollController.dispose();

    super.dispose();
  }

  // Function to handle scrolling to a section
  void _scrollToSection(GlobalKey key) {
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
        alignment: 0.1, // Adjust alignment as needed
      );
    }
  }

  // Function to determine the active section based on scroll position
  void _onScroll() {
    // Define a lower threshold from the top of the scroll view for increased sensitivity
    const double threshold = 40.0; // Reduced from 80.0 to 40.0

    // Get the RenderBox of the scroll view
    final RenderBox? scrollViewBox =
        _scrollViewKey.currentContext?.findRenderObject() as RenderBox?;

    if (scrollViewBox == null) return;

    // Function to get the offset of a section relative to the scroll view
    double getSectionOffset(GlobalKey key) {
      final RenderBox? renderBox =
          key.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox == null) return double.infinity;
      return renderBox.localToGlobal(Offset.zero, ancestor: scrollViewBox).dy;
    }

    // Get the positions of each section
    double aboutPosition = getSectionOffset(_aboutKey);
    double experiencePosition = getSectionOffset(_experienceKey);
    double academicsPosition = getSectionOffset(_academicsKey);

    // Debugging: Print the positions
    print('About Position: $aboutPosition');
    print('Experience Position: $experiencePosition');
    print('Academics Position: $academicsPosition');

    String newActiveSection = _activeSection;

    // Check if the scroll has reached the end of the scroll view
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - threshold) {
      newActiveSection = 'Academics';
    } else {
      // Prioritize Academics section
      if (academicsPosition - threshold <= 0) {
        newActiveSection = 'Academics';
      }
      // Then check Experience section
      else if (experiencePosition - threshold <= 0) {
        newActiveSection = 'Experience';
      }
      // Finally, check About section
      else if (aboutPosition - threshold <= 0) {
        newActiveSection = 'About';
      }
    }

    // Update the active section if it has changed
    if (newActiveSection != _activeSection) {
      setState(() {
        _activeSection = newActiveSection;
      });
    }
  }

  // Helper method to get the section key
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

  // Widget builder for navigation links with animations
  Widget _buildNavLink(String title, String section) {
    bool isActive = _activeSection == section;
    return GestureDetector(
      onTap: () {
        _scrollToSection(_getSectionKey(section));
      },
      child: Row(
        children: [
          // Animated Line Before the Link
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
          // Animated Link Text
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
    return Scaffold(
      backgroundColor: widget.isDarkMode
          ? const Color(0xFFDBDBDB)
          : const Color(0xFF2A2A2A),
      body: Row(
        children: [
          // Left Half - Fixed Section with Modified Navigation Links
          Container(
            width: MediaQuery.of(context).size.width * 0.4,
            color: widget.isDarkMode
                ? const Color(0xFFDBDBDB)
                : const Color(0xFF2A2A2A),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back Button
                Hero(
                  tag: 'portfolioButtonHero',
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color:
                          widget.isDarkMode ? Colors.black : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      icon: Icon(
                        Icons.arrow_back,
                        color: widget.isDarkMode
                            ? Colors.white
                            : Colors.black,
                      ),
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Name
                Text(
                  'Venkat L. Turlapati',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color:
                        widget.isDarkMode ? Colors.black : Colors.white,
                  ),
                ),
              
                const SizedBox(height: 40),
                // Navigation Links with Enhanced Styling and Animations
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildNavLink('About', 'About'),
                    const SizedBox(height: 24.0), // Space Between Links
                    _buildNavLink('Experience', 'Experience'),
                    const SizedBox(height: 24.0), // Space Between Links
                    _buildNavLink('Academics', 'Academics'),
                  ],
                ),
              ],
            ),
          ),
          // Right Half - Scrollable Section
          Expanded(
            child: SingleChildScrollView(
              key: _scrollViewKey, // Assign the GlobalKey here
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 70),
                  // About Section
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
                            style: TextStyle(fontWeight: FontWeight.bold),
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
                  const SizedBox(height: 40), // Space before Experience Section
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
                            color: widget.isDarkMode
                                ? Colors.black
                                : Colors.white,
                          ),
                        ),
                        const SizedBox(height: 20),
                        TimelineEntry(
                          isDarkMode: widget.isDarkMode,
                          timeline: '2022 - 2024',
                          title: 'Software Developer (Consultant)',
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
                          onTap: () => _launchURL('https://example.com/church-dwight'),
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
                          onTap: () => _launchURL('https://example.com/revv-digital'),
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
                          onTap: () => _launchURL('https://example.com/coign-pvt-ltd'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 60), // Space before Academics Section
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
                              'Master’s Degree · Information Technology and Management',
                          descriptions: [],
                          skills: [
                            'GPA: 3.77 / 4.0'
                          ],
                          onTap: () => _launchURL('https://example.com/ut-dallas'),
                        ),
                        const SizedBox(height: 20),
                        TimelineEntry(
                          isDarkMode: widget.isDarkMode,
                          timeline: '2018 - 2022',
                          title: 'Osmania University',
                          companyOrInstitution:
                              'Bachelor’s Degree · Computer Science',
                          descriptions: [],
                          skills: [
                            'GPA: 3.0 / 4.0'
                          ],
                          onTap: () => _launchURL('https://example.com/osmania-university'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 180), // Adjusted spacing
                  // Footer Section
                  Padding(
                    padding: const EdgeInsets.only(right: 200.0),
                    child: Align(
                      alignment: Alignment.center,
                      child: Text(
                        'Designed in Figma, coded in Flutter (because why not?), and deployed on AWS. Inter typeface ties it all together.',
                        textAlign: TextAlign.left,
                        style: TextStyle(
                          fontSize: 14,
                          color: widget.isDarkMode
                              ? Colors.black87
                              : Colors.white70,
                          height: 1.5,
                        ),
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
  final VoidCallback? onTap; // Optional callback for clicks

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
            color: isHovered
                ? widget.isDarkMode
                    ? Colors.white.withOpacity(0.1)
                    : Colors.black.withOpacity(0.1)
                : Colors.transparent,
            border: isHovered
                ? Border.all(
                    color: widget.isDarkMode
                        ? Colors.white.withOpacity(0.2)
                        : Colors.black.withOpacity(0.2),
                  )
                : null,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: isHovered ? 10.0 : 0.0,
                sigmaY: isHovered ? 10.0 : 0.0,
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Timeline Section
                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.1,
                      child: Text(
                        widget.timeline,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: widget.isDarkMode
                              ? Colors.black
                              : Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Content Section
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          Text(
                            widget.title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: widget.isDarkMode
                                  ? Colors.black
                                  : Colors.white,
                              decoration: widget.onTap != null
                                  ? TextDecoration.underline
                                  : TextDecoration.none,
                            ),
                          ),
                          const SizedBox(height: 4),
                          // Company or Institution
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