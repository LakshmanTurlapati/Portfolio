import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart'; 
import 'spotlight.dart';

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
  return Scaffold(
    backgroundColor: widget.isDarkMode
        ? const Color(0xFFDBDBDB) // Light background for dark mode
        : const Color(0xFF2A2A2A), // Dark background for light mode
    body: SpotlightEffect(
      isDarkMode: widget.isDarkMode, // Pass the theme mode dynamically
      child: Row(
        children: [
          // Sidebar
          Container(
            width: MediaQuery.of(context).size.width * 0.4,
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
          Expanded(
            child: SingleChildScrollView(
              key: _scrollViewKey, 
              controller: _scrollController,
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
                              'Master’s Degree · Information Technology and Management',
                          descriptions: [],
                          skills: [
                            'GPA: 3.77 / 4.0'
                          ],
                          onTap: () => _launchURL('https://www.utdallas.edu/'),
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
  ));
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
            border: isHovered
                ? Border.all(
                    color: widget.isDarkMode
                        ? Colors.black.withOpacity(0.2)
                        : Colors.white.withOpacity(0.2),
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