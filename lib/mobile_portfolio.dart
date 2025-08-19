import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'snow.dart';

class MobilePortfolioPage extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const MobilePortfolioPage({
    Key? key,
    required this.isDarkMode,
    required this.toggleTheme,
  }) : super(key: key);

  @override
  State<MobilePortfolioPage> createState() => _MobilePortfolioPageState();
}

class _MobilePortfolioPageState extends State<MobilePortfolioPage> {
  final ScrollController mobile_scrollController = ScrollController();
  final GlobalKey mobile_scrollViewKey = GlobalKey();

  // Define GlobalKeys for each project
  final List<GlobalKey> mobile_projectKeys = [
    for (var i = 0; i < 21; i++) GlobalKey(),
  ];

  // Track the index of the active project
  int mobile_activeProjectIndex = -1;

  // -----------------------------------------------------
  // 1) Define the projects here so we can precache them
  // -----------------------------------------------------
  final List<Map<String, dynamic>> projects = [
    {
      "name": "Review Gate",
      "image": "assets/review_gate.webp",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Review-Gate",
      },
    },
    {
      "name": "Blockchain Smartcontracts",
      "image": "assets/blockchain.jpg",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Blockchain",
      }
    },
    {
      "name": "Smart Fabric using IOT",
      "image": "assets/sfuit.jpg",
      "links": {
        "Website": "https://www.youtube.com/watch?v=AkKRSgQnT_c",
        "GitHub": "https://github.com/prateek10201/sfuit-esp8266",
      }
    },
    {
      "name": "Portfolio",
      "image": "assets/portfolio.jpg",
      "links": {
        "Website": "https://audienclature.com",
        "GitHub": "https://github.com/LakshmanTurlapati/Portfolio",
        "Design":
            "https://www.figma.com/design/UeixAHUPLTSKiwHR9HVfT2/Portfolio?node-id=0-1&t=QkxcB16bQkJ96mpv-1"
      }
    },
    {
      "name": "Financial Inclusion",
      "image": "assets/fi.png",
      "links": {
        "Website": "https://docs.google.com/document/d/1cq1xeUpl-lst5bj4376_QhCSo7HIc1EvPecKw0cmQGc/edit?usp=sharing",
        "GitHub":
            "https://github.com/LakshmanTurlapati/Financial-Inclusion-v2",
            "Design":"https://www.figma.com/design/5kNlAtt2Hh6NTx2YAPLhIu/Financial-Inclusion?node-id=0-1&t=jnAr4kRmQeHKDdOg-1"
      }
    },
    {
      "name": "LinkedIn Auto Connect",
      "image": "assets/linkedin.png",
      "links": {
        "Website": "https://chromewebstore.google.com/detail/linkedin-auto-connect/jomecnphbmfpkcajfhkoebgmbcbakjoa?authuser=1&hl=en&pli=1",
        "GitHub":
            "https://github.com/LakshmanTurlapati/linkedin-autoconnect-extension/tree/main",
      }
    },
    {
      "name": "Service Portal",
      "image": "assets/chd.png",
      "links": {
        "GitHub":
            "https://github.com/LakshmanTurlapati/Church-Dwight-Solution-Center",
        "Design":
            "https://www.figma.com/design/Lj0O8tBvyuGSx3LePBCuO1/C%26D?node-id=0-1&t=QO284B9qHF3brzcH-1"
      }
    },
    {
      "name": "X-Read",
      "image": "",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/DCTE-Script",
      },
      "useIframe": true,
    },
    {
      "name": "Heartline",
      "image": "assets/heartline.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Heartline",
      },
    },
    {
      "name": "Lucent",
      "image": "assets/lucent.png",
      "links": {
        "Website": "https://monumental-granita-08d2f5.netlify.app",
        "GitHub": "https://github.com/LakshmanTurlapati/Lucent",
      },
    },
    {
      "name": "Parz-AI",
      "image": "assets/parz_ai.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Parz-AI",
      },
    },
    {
      "name": "awsxUTD-Hackathon",
      "image": "assets/hackathon.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/awsxUTD-Hackathon",
      },
    },
    {
      "name": "T2S CLI",
      "image": "assets/t2s_cli.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/t2s-cli",
      },
    },
    {
      "name": "Star-Trail-Flutter",
      "image": "assets/startrail.jpg",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Star-Trail-Flutter",
      },
    },
    {
      "name": "awsxutd",
      "image": "assets/awsxutd.png",
      "links": {
        "Website":"https://marvelous-sopapillas-cf2910.netlify.app",
        "GitHub": "https://github.com/LakshmanTurlapati/awsxutd",
      },
    },
    {
      "name": "Open-API",
      "image": "assets/open_api.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/open-api",
      },
    },
    {
      "name": "ArtScii",
      "image": "assets/artscii.jpg",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/ArtScii",
      },
    },
    {
      "name": "FSB",
      "image": "assets/fsb.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/FSB",
      },
    },
    {
      "name": "Asteroids Game",
      "image": "assets/asteroids.png",
      "links": {
        "Website": "https://harmonious-caramel-3c3627.netlify.app",
        "GitHub": "https://github.com/LakshmanTurlapati/Atari-Astroids-Multiplayer",
      },
    },
    {
      "name": "ProKeys",
      "image": "assets/prokeys.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/ProKeys",
      },
    },
    {
      "name": "SmolLM Flutter",
      "image": "assets/smollm_flutter.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/SmolLm-Flutter",
      },
    },
  ];

  @override
  void initState() {
    super.initState();
    mobile_scrollController.addListener(mobile_onScroll);

    // -----------------------------------------------------
    // 2) Precache each project's image for better performance
    // -----------------------------------------------------
    WidgetsBinding.instance.addPostFrameCallback((_) {
      for (var project in projects) {
        final imageUrl = project['image'];
        if (imageUrl is String && imageUrl.isNotEmpty) {
          // Check if it's a remote URL or a local asset
          if (imageUrl.startsWith('http')) {
            precacheImage(NetworkImage(imageUrl), context);
          } else {
            precacheImage(AssetImage(imageUrl), context);
          }
        }
      }
      mobile_updateActiveProject();
    });
  }

  @override
  void dispose() {
    mobile_scrollController.dispose();
    super.dispose();
  }

  void mobile_onScroll() {
    mobile_updateActiveProject();
  }

  void mobile_updateActiveProject() {
    final RenderBox? scrollViewBox =
        mobile_scrollViewKey.currentContext?.findRenderObject() as RenderBox?;
    if (scrollViewBox == null) return;

    final double viewportHeight = scrollViewBox.size.height;
    final double viewportCenter = viewportHeight / 2;

    double closestDistance = double.infinity;
    int closestIndex = -1;

    for (int i = 0; i < mobile_projectKeys.length; i++) {
      final key = mobile_projectKeys[i];
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

    if (closestIndex != mobile_activeProjectIndex) {
      setState(() {
        mobile_activeProjectIndex = closestIndex;
      });
    }
  }

  Future<void> mobile_launchURL(String url) async {
    if (url.isEmpty) return;
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const double backButtonPadding = 10.0;
    const double gridOuterPadding = 24.0;
    const double itemSpacing = 32.0;
    const double itemWidth = 320.0; // Fixed width for all items

    return Scaffold(
      backgroundColor: widget.isDarkMode
          ? const Color(0xFFDBDBDB) // Light background for dark mode
          : const Color(0xFF2A2A2A), // Dark background for light mode
      body: SnowfallEffect(
        isDarkMode: widget.isDarkMode,
        child: SingleChildScrollView(
          key: mobile_scrollViewKey,
          controller: mobile_scrollController,
          padding: const EdgeInsets.symmetric(horizontal: gridOuterPadding, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center, // Center the items
            children: [
              // Header with Back Button
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: backButtonPadding, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
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
                            color:
                                widget.isDarkMode ? Colors.white : Colors.black,
                          ),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Projects List with Individual Aspect Ratios
              ...projects.asMap().entries.map((entry) {
                final index = entry.key;
                final project = entry.value;
                return Padding(
                  padding: EdgeInsets.only(bottom: index == projects.length - 1 ? 0 : itemSpacing),
                  child: SizedBox(
                    width: itemWidth,
                    child: MobilePortfolioGridItem(
                      key: mobile_projectKeys[index],
                      isDarkMode: widget.isDarkMode,
                      isActive: mobile_activeProjectIndex == index,
                      onTap: () {
                        mobile_launchURL(
                          project["links"]["Website"] as String? ??
                              project["links"]["GitHub"] as String? ??
                              "",
                        );
                      },
                      projectName: project["name"] as String,
                      projectImage: project["image"] as String,
                      links: Map<String, String>.from(project["links"]),
                      useIframe: project["useIframe"] as bool? ?? false,
                    ),
                  ),
                );
              }).toList(),
              
              const SizedBox(height: 20),

              // Footer
              Center(
                child: RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontSize: 12,
                      color: widget.isDarkMode ? Colors.black : Colors.white,
                    ),
                    children: [
                      const TextSpan(text: "Some of my "),
                      TextSpan(
                        text: "'finest works'",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const TextSpan(text: " are missing, Thanks to the "),
                      TextSpan(
                        text: "'NDA'",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const TextSpan(text: "!"),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}

class MobilePortfolioGridItem extends StatelessWidget {
  final bool isDarkMode;
  final bool isActive;
  final VoidCallback? onTap;
  final String projectName;
  final String projectImage;
  final Map<String, String> links;
  final bool useIframe;

  const MobilePortfolioGridItem({
    Key? key,
    required this.isDarkMode,
    this.isActive = false,
    this.onTap,
    required this.projectName,
    required this.projectImage,
    required this.links,
    required this.useIframe,
  }) : super(key: key);

  Future<void> mobile_launchLink(BuildContext context, String? url) async {
    if (url == null || url.isEmpty) return;
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    Color activeColor = isDarkMode
        ? Colors.grey.withOpacity(0.1)
        : Colors.black.withOpacity(0.05);

    Color borderColor = isDarkMode
        ? Colors.black.withOpacity(0.3)
        : Colors.white.withOpacity(0.3);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: isActive ? activeColor : Colors.transparent,
          border: Border.all(
            color: isActive ? borderColor : Colors.transparent,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: isActive ? 4.0 : 0.0,
              sigmaY: isActive ? 4.0 : 0.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Project Image with Natural Aspect Ratio
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(left: 8.0, right: 8, top: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: useIframe || projectImage.isEmpty
                        ? Container(
                            height: 180, // Fixed height for iframe projects
                            color: isDarkMode
                                ? Colors.grey[300]
                                : Colors.grey[800],
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.code,
                                    size: 40,
                                    color: isDarkMode
                                        ? Colors.grey[600]
                                        : Colors.grey[400],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Interactive Project',
                                    style: TextStyle(
                                      color: isDarkMode
                                          ? Colors.grey[600]
                                          : Colors.grey[400],
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : projectImage.startsWith('http')
                            ? Image.network(
                                projectImage,
                                fit: BoxFit.fitWidth,
                                width: double.infinity,
                              )
                            : Image.asset(
                                projectImage,
                                fit: BoxFit.fitWidth,
                                width: double.infinity,
                              ),
                  ),
                ),
                
                // Project Name and Links Section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    children: [
                      // Project Name
                      Expanded(
                        child: Text(
                          projectName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isDarkMode ? Colors.black : Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Action Icons
                      Row(
                        children: links.entries.map((entry) {
                          IconData icon;
                          switch (entry.key) {
                            case "Website":
                              icon = FontAwesomeIcons.link;
                              break;
                            case "GitHub":
                              icon = FontAwesomeIcons.codeBranch;
                              break;
                            case "Design":
                              icon = FontAwesomeIcons.figma;
                              break;
                            default:
                              icon = FontAwesomeIcons.link;
                          }
                          return Padding(
                            padding: const EdgeInsets.only(left: 8.0),
                            child: IconButton(
                              icon: FaIcon(
                                icon,
                                size: 16,
                                color: isDarkMode ? Colors.black : Colors.white,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                mobile_launchLink(context, entry.value);
                              },
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
    );
  }
}