import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'snow.dart';
import 'mobile_portfolio.dart' as mobile;  

class PortfolioPage extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback toggleTheme;

  const PortfolioPage({
    Key? key,
    required this.isDarkMode,
    required this.toggleTheme,
  }) : super(key: key);

  @override
  State<PortfolioPage> createState() => _PortfolioPageState();
}

class _PortfolioPageState extends State<PortfolioPage> {
  // -----------------------------------------
  // 1) Define desktop projects at class-level
  // -----------------------------------------
  final List<Map<String, dynamic>> desktopProjects = [
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
    // -----------------------------------------
    // 2) Precache all desktop images
    // -----------------------------------------
    WidgetsBinding.instance.addPostFrameCallback((_) {
      for (var project in desktopProjects) {
        final imageUrl = project['image'];
        if (imageUrl is String && imageUrl.isNotEmpty) {
          if (imageUrl.startsWith('http')) {
            precacheImage(NetworkImage(imageUrl), context);
          } else {
            precacheImage(AssetImage(imageUrl), context);
          }
        }
      }
    });
  }

  Future<void> desktop_launchURL(String url) async {
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

    // Determine if the device is mobile based on width
    bool isMobile = size.width < 600;

    // -----------------------------------------
    // If on mobile, use the MobilePortfolioPage
    // -----------------------------------------
    if (isMobile) {
      return mobile.MobilePortfolioPage(
        isDarkMode: widget.isDarkMode,
        toggleTheme: widget.toggleTheme,
      );
    }

    // -----------------------------------------
    // Otherwise, show the Desktop version
    // -----------------------------------------
    const double headerPadding = 20.0;
    const double gridOuterPadding = 58.0;
    const double containerHeight = 280.0;
    const double containerWidth = 1.4 * containerHeight;

    final double totalGridWidth = 3 * containerWidth;
    final double remainingWidth =
        size.width - (2 * gridOuterPadding) - totalGridWidth;
    final double gridSpacing =
        remainingWidth > 0 ? remainingWidth / 2 : 44.0;

    const double headerHeight = 60.0;
    final double totalGridHeight = 2 * containerHeight;
    final double remainingHeight = size.height -
        (2 * gridOuterPadding) -
        totalGridHeight -
        headerHeight -
        60;
    final double verticalSpacing =
        remainingHeight > 0 ? remainingHeight / 1 : 44.0;

    // You might want to show all 6, or subset the list if needed
    final List<Map<String, dynamic>> displayProjects = desktopProjects.length > 6
        ? desktopProjects.sublist(0, 6)
        : desktopProjects;

    return Scaffold(
      backgroundColor:
          widget.isDarkMode ? const Color(0xFFDBDBDB) : const Color(0xFF2A2A2A),
      body: SnowfallEffect(
        isDarkMode: widget.isDarkMode,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Back Button
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: headerPadding,
                vertical: 10.0,
              ),
              child: SizedBox(
                height: headerHeight,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Hero(
                      tag: 'portfolioButtonHero',
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: widget.isDarkMode
                              ? Colors.black
                              : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: IconButton(
                          icon: Icon(
                            Icons.arrow_back,
                            color: widget.isDarkMode
                                ? Colors.white
                                : Colors.black,
                          ),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Desktop Projects Grid
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  left: gridOuterPadding,
                  right: gridOuterPadding,
                  top: 20,
                  bottom: gridOuterPadding,
                ),
                child: GridView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: verticalSpacing,
                    crossAxisSpacing: gridSpacing,
                    childAspectRatio: containerWidth / containerHeight,
                  ),
                  itemCount: displayProjects.length,
                  itemBuilder: (context, index) {
                    final project = displayProjects[index];
                    return DesktopPortfolioGridItem(
                      isDarkMode: widget.isDarkMode,
                      onTap: () {
                        // If no "Website" link, fallback to "GitHub"
                        desktop_launchURL(
                          project["links"]["Website"] as String? ?? "",
                        );
                      },
                      projectName: project["name"] as String,
                      projectImage: project["image"] as String,
                      links: Map<String, String>.from(project["links"]),
                      width: containerWidth,
                      height: containerHeight,
                    );
                  },
                ),
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.only(bottom: 22.0),
              child: Center(
                child: RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontSize: 12,
                      color:
                          widget.isDarkMode ? Colors.black : Colors.white,
                    ),
                    children: [
                      const TextSpan(text: "Some of my "),
                      TextSpan(
                        text: "finest works",
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
            ),
          ],
        ),
      ),
    );
  }
}

class DesktopPortfolioGridItem extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback? onTap;
  final String projectName;
  final String projectImage;
  final Map<String, String> links;
  final double width;
  final double height;

  const DesktopPortfolioGridItem({
    Key? key,
    required this.isDarkMode,
    this.onTap,
    required this.projectName,
    required this.projectImage,
    required this.links,
    required this.width,
    required this.height,
  }) : super(key: key);

  @override
  State<DesktopPortfolioGridItem> createState() =>
      _DesktopPortfolioGridItemState();
}

class _DesktopPortfolioGridItemState extends State<DesktopPortfolioGridItem> {
  bool isHovered = false;

  Future<void> desktop_launchLink(String? url) async {
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
    Color hoverColor = widget.isDarkMode
        ? Colors.grey.withOpacity(0.05)
        : Colors.black.withOpacity(0.05);

    return MouseRegion(
      cursor: widget.onTap != null ? SystemMouseCursors.click : MouseCursor.defer,
      onEnter: (_) => setState(() => isHovered = true),
      onExit: (_) => setState(() => isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: widget.width,
          height: widget.height,
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
                sigmaX: isHovered ? 4.0 : 0.0,
                sigmaY: isHovered ? 4.0 : 0.0,
              ),
              child: Stack(
                children: [
                  // Project Image
                  Padding(
                    padding: const EdgeInsets.only(
                      left: 22,
                      right: 22,
                      top: 22,
                      bottom: 44,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: widget.projectImage.startsWith('http')
                          ? Image.network(
                              widget.projectImage,
                              fit: BoxFit.cover,
                              width: widget.width - 16,
                              height: widget.height - 16,
                            )
                          : Image.asset(
                              widget.projectImage,
                              fit: BoxFit.cover,
                              width: widget.width - 16,
                              height: widget.height - 16,
                            ),
                    ),
                  ),

                  // Title & links
                  Positioned(
                    bottom: 8,
                    left: 22,
                    right: 22,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Project Name
                        Expanded(
                          child: Text(
                            widget.projectName,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: widget.isDarkMode
                                  ? Colors.black
                                  : Colors.white,
                              shadows: [
                                Shadow(
                                  blurRadius: 4,
                                  color: widget.isDarkMode
                                      ? Colors.white.withOpacity(0.7)
                                      : Colors.black.withOpacity(0.7),
                                  offset: const Offset(1, 1),
                                ),
                              ],
                            ),
                            textAlign: TextAlign.left,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        // Link Icons
                        Row(
                          children: [
                            if (widget.links.containsKey("Website"))
                              IconButton(
                                icon: const FaIcon(
                                  FontAwesomeIcons.link,
                                  size: 16,
                                ),
                                color: widget.isDarkMode
                                    ? Colors.black
                                    : Colors.white,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () {
                                  desktop_launchLink(widget.links["Website"]);
                                },
                              ),
                            const SizedBox(width: 8),
                            if (widget.links.containsKey("GitHub"))
                              IconButton(
                                icon: const FaIcon(
                                  FontAwesomeIcons.codeFork,
                                  size: 16,
                                ),
                                color: widget.isDarkMode
                                    ? Colors.black
                                    : Colors.white,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () {
                                  desktop_launchLink(widget.links["GitHub"]);
                                },
                              ),
                            const SizedBox(width: 8),
                            if (widget.links.containsKey("Design"))
                              IconButton(
                                icon: const FaIcon(
                                  FontAwesomeIcons.figma,
                                  size: 16,
                                ),
                                color: widget.isDarkMode
                                    ? Colors.black
                                    : Colors.white,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () {
                                  desktop_launchLink(widget.links["Design"]);
                                },
                              ),
                          ],
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
    );
  }
}