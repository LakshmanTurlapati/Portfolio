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
    for (var i = 0; i < 6; i++) GlobalKey(),
  ];

  // Track the index of the active project
  int mobile_activeProjectIndex = -1;

  // -----------------------------------------------------
  // 1) Define the projects here so we can precache them
  // -----------------------------------------------------
  final List<Map<String, dynamic>> projects = [
    {
      "name": "Blockchain Smartcontracts",
      "image": "assets/blockchain.jpg",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Portfolio",
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
      "image": "assets/finance.jpg",
      "links": {
        "Website": "https://www.youtube.com/watch?v=4-z_v_sE5C8",
        "GitHub":
            "https://github.com/LakshmanTurlapati/Financial-Inclusion/tree/main/Dashboard",
      }
    },
    {
      "name": "Movie Recommender",
      "image": "assets/movie.png",
      "links": {
        "GitHub":
            "https://github.com/LakshmanTurlapati/Movie-Recommendation-System",
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
    final size = MediaQuery.of(context).size;

    // Determine number of columns based on screen width
    int crossAxisCount = 1;
    double screenWidth = size.width;
    if (screenWidth >= 600) {
      crossAxisCount = 2;
    }
    if (screenWidth >= 900) {
      crossAxisCount = 3;
    }

    const double backButtonPadding = 10.0;
    const double gridOuterPadding = 24.0;
    const double gridSpacing = 44.0;
    const double gridItemAspectRatio = 1.4; // Width / Height

    return Scaffold(
      backgroundColor: widget.isDarkMode
          ? const Color(0xFFDBDBDB) // Light background for dark mode
          : const Color(0xFF2A2A2A), // Dark background for light mode
      body: SnowfallEffect(
        isDarkMode: widget.isDarkMode,
        // ----------------------------------------------
        // 3) Wrap your scroll view with the snow effect
        // ----------------------------------------------
        child: SingleChildScrollView(
          key: mobile_scrollViewKey,
          controller: mobile_scrollController,
          padding:
              const EdgeInsets.symmetric(horizontal: gridOuterPadding, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
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
                    // Optional: Add theme toggle or other actions here
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Projects Grid
              GridView.builder(
                key: const PageStorageKey<String>('portfolioGridMobile'),
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: gridSpacing,
                  mainAxisSpacing: gridSpacing,
                  childAspectRatio: gridItemAspectRatio,
                ),
                itemCount: projects.length,
                itemBuilder: (context, index) {
                  final project = projects[index];
                  return MobilePortfolioGridItem(
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
                  );
                },
              ),
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

  const MobilePortfolioGridItem({
    Key? key,
    required this.isDarkMode,
    this.isActive = false,
    this.onTap,
    required this.projectName,
    required this.projectImage,
    required this.links,
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
              sigmaX: isActive ? 4.0 : 0.0,
              sigmaY: isActive ? 4.0 : 0.0,
            ),
            child: Stack(
              children: [
                // Project Image
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.only(left:12.0,right:12,top:12,bottom: 58),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: projectImage.startsWith('http')
                          ? Image.network(
                              projectImage,
                              fit: BoxFit.cover,
                            )
                          : Image.asset(
                              projectImage,
                              fit: BoxFit.cover,
                            ),
                    ),
                  ),
                ),
                // Project Name and Links Overlay
                Positioned(
                  bottom: 6,
                  left: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8.0, vertical: 4.0),
                    decoration: BoxDecoration(
                      color: isDarkMode
                          ? Colors.black.withOpacity(0)
                          : Colors.white.withOpacity(0),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        // Project Name
                        Expanded(
                          child: Text(
                            projectName,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color:
                                  isDarkMode ? Colors.black : Colors.white,
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
                                  color:
                                      isDarkMode ? Colors.black : Colors.white,
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
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}