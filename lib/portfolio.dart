import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'dart:html' as html;
import 'dart:js' as js;
import 'snow.dart';
import 'mobile_portfolio.dart' as mobile;

// Extension for calculating optimal cache size based on device pixel ratio
extension ImageSizeExtension on num {
  int cacheSize(BuildContext context) {
    return (this * MediaQuery.of(context).devicePixelRatio).round();
  }
}

// Data class to store image information
class ImageData {
  final bool isLoading;
  final double? aspectRatio;
  
  const ImageData({
    required this.isLoading,
    required this.aspectRatio,
  });
}

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
      },
    },
    {
      "name": "Smart Fabric using IOT",
      "image": "assets/sfuit.jpg",
      "links": {
        "Website": "https://www.youtube.com/watch?v=AkKRSgQnT_c",
        "GitHub": "https://github.com/prateek10201/sfuit-esp8266",
      },
    },
    {
      "name": "Portfolio",
      "image": "assets/portfolio.jpg",
      "links": {
        "Website": "https://audienclature.com",
        "GitHub": "https://github.com/LakshmanTurlapati/Portfolio",
        "Design":
            "https://www.figma.com/design/UeixAHUPLTSKiwHR9HVfT2/Portfolio?node-id=0-1&t=QkxcB16bQkJ96mpv-1"
      },
    },
    {
      "name": "Financial Inclusion",
      "image": "assets/fi.png",
      "links": {
        "Website": "https://docs.google.com/document/d/1cq1xeUpl-lst5bj4376_QhCSo7HIc1EvPecKw0cmQGc/edit?usp=sharing",
        "GitHub": "https://github.com/LakshmanTurlapati/Financial-Inclusion-v2",
        "Design":"https://www.figma.com/design/5kNlAtt2Hh6NTx2YAPLhIu/Financial-Inclusion?node-id=0-1&t=jnAr4kRmQeHKDdOg-1"
      },
    },
    {
      "name": "LinkedIn Auto Connect",
      "image": "assets/linkedin.png",
      "links": {
        "Website": "https://chromewebstore.google.com/detail/linkedin-auto-connect/jomecnphbmfpkcajfhkoebgmbcbakjoa?authuser=1&hl=en&pli=1",
        "GitHub": "https://github.com/LakshmanTurlapati/linkedin-autoconnect-extension/tree/main",
      },
    },
    {
      "name": "Service Portal",
      "image": "assets/chd.png",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/Church-Dwight-Solution-Center",
        "Design": "https://www.figma.com/design/Lj0O8tBvyuGSx3LePBCuO1/C%26D?node-id=0-1&t=QO284B9qHF3brzcH-1"
      },
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
      "name": "T2S",
      "image": "",
      "links": {
        "GitHub": "https://github.com/LakshmanTurlapati/T2S",
      },
      "useIframe": true,
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
  ];

  // Enhanced image data structure to store aspect ratios and loading states
  final Map<String, ImageData> imageDataCache = {};
  
  // Base dimensions for grid items
  final double baseItemWidth = 300.0;
  final double baseItemHeight = 280.0;
  final double minItemHeight = 200.0;
  final double maxItemHeight = 400.0;

  @override
  void initState() {
    super.initState();
    // Initialize image data and start loading aspect ratios
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeImageData();
    });
  }

  void _initializeImageData() {
    for (var project in desktopProjects) {
      final imageUrl = project['image'] as String;
      if (imageUrl.isNotEmpty) {
        imageDataCache[imageUrl] = ImageData(
          isLoading: true,
          aspectRatio: null,
        );
        _loadImageAspectRatio(imageUrl);
      }
    }
  }

  Future<void> _loadImageAspectRatio(String imageUrl) async {
    try {
      final ImageProvider imageProvider = imageUrl.startsWith('http') 
          ? NetworkImage(imageUrl) 
          : AssetImage(imageUrl) as ImageProvider;
      
      // Create a completer to handle the async operation
      final imageStream = imageProvider.resolve(const ImageConfiguration());
      late ImageStreamListener listener;
      
      listener = ImageStreamListener((ImageInfo info, bool _) {
        if (mounted) {
          final double aspectRatio = info.image.width / info.image.height;
          setState(() {
            imageDataCache[imageUrl] = ImageData(
              isLoading: false,
              aspectRatio: aspectRatio,
            );
          });
        }
        imageStream.removeListener(listener);
      }, onError: (exception, stackTrace) {
        if (mounted) {
          setState(() {
            imageDataCache[imageUrl] = ImageData(
              isLoading: false,
              aspectRatio: 1.0, // Default square ratio on error
            );
          });
        }
        imageStream.removeListener(listener);
      });
      
      imageStream.addListener(listener);
      
      // Also precache the image for better performance
      await precacheImage(imageProvider, context);
      
    } catch (e) {
      if (mounted) {
        setState(() {
          imageDataCache[imageUrl] = ImageData(
            isLoading: false,
            aspectRatio: 1.0, // Default square ratio on error
          );
        });
      }
    }
  }

  // Calculate optimal height based on aspect ratio and design principles
  double _calculateOptimalHeight(double? aspectRatio) {
    if (aspectRatio == null) {
      return baseItemHeight; // Default height while loading
    }
    
    // Account for container padding: top: 15, bottom: 50 = 65px total
    const double containerPadding = 65.0;
    
    // Pure calculation: height = width / aspectRatio
    // This ensures the image fills the exact width with no borders
    double imageHeight = baseItemWidth / aspectRatio;
    
    // Add padding to get total container height
    double totalContainerHeight = imageHeight + containerPadding;
    
    // NO HEIGHT CONSTRAINTS - let it be as tall or short as needed!
    // Only prevent completely unreasonable values
    totalContainerHeight = totalContainerHeight.clamp(100.0, 1050.0);
    
    return totalContainerHeight;
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

    final double totalGridWidth = 4 * baseItemWidth; // Use baseItemWidth instead of fixedContainerWidth
    final double remainingWidth =
        size.width - (2 * gridOuterPadding) - totalGridWidth;
    final double gridSpacing =
        remainingWidth > 0 ? remainingWidth / 6 : 10.0; // Reduced spacing by 50%

    const double headerHeight = 60.0;
    final double totalGridHeight = 2 * containerHeight;
    final double remainingHeight = size.height -
        (2 * gridOuterPadding) -
        totalGridHeight -
        headerHeight -
        60;
    final double verticalSpacing =
        remainingHeight > 0 ? remainingHeight / 2 : 10.0; // Reduced spacing by 50%

    // Display projects with Review Gate always first, rest in randomized order
    final List<Map<String, dynamic>> displayProjects = List.from(desktopProjects);
    
    // Find Review Gate project and ensure it's first
    final reviewGateProject = displayProjects.firstWhere(
      (project) => project["name"] == "Review Gate",
      orElse: () => {},
    );
    
    // Remove Review Gate from the list and shuffle the rest
    displayProjects.removeWhere((project) => project["name"] == "Review Gate");
    displayProjects.shuffle();
    
    // Insert Review Gate at the beginning if it was found
    if (reviewGateProject.isNotEmpty) {
      displayProjects.insert(0, reviewGateProject);
    }

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
                vertical: 8.0,
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

            const SizedBox(height: 15),

            // Desktop Projects Masonry Layout
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  left: gridOuterPadding,
                  right: gridOuterPadding,
                  top: 0,
                  bottom: gridOuterPadding,
                ),
                child: ShaderMask(
                  shaderCallback: (Rect rect) {
                    return LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black,
                        Colors.black,
                        Colors.transparent
                      ],
                      stops: const [0.0, 0.02, 0.98, 1.0],
                    ).createShader(rect);
                  },
                  blendMode: BlendMode.dstIn,
                  child: MasonryGridView.count(
                    physics: const BouncingScrollPhysics(),
                    crossAxisCount: 4,
                    mainAxisSpacing: verticalSpacing,
                    crossAxisSpacing: gridSpacing,
                    itemCount: displayProjects.length,
                    itemBuilder: (context, index) {
                      final project = displayProjects[index];
                      final String imageUrl = project['image'] as String;
                      
                      // Calculate height based on actual image aspect ratio
                      double itemHeight;
                      
                      if (imageUrl.isEmpty || project['useIframe'] == true) {
                        // For items without images or with iframes, use a standard height
                        itemHeight = baseItemHeight;
                      } else {
                        // For items with images, calculate based on aspect ratio
                        final imageData = imageDataCache[imageUrl];
                        if (imageData != null && !imageData.isLoading && imageData.aspectRatio != null) {
                          itemHeight = _calculateOptimalHeight(imageData.aspectRatio);
                        } else {
                          // If aspect ratio not yet calculated, use standard height
                          itemHeight = baseItemHeight;
                        }
                      }
                      
                      return DesktopPortfolioGridItem(
                        isDarkMode: widget.isDarkMode,
                        onTap: () {
                          // Special case for Portfolio project - prioritize Design link
                          if (project["name"] == "Portfolio") {
                            final String designUrl = project["links"]["Design"] as String? ?? "";
                            final String websiteUrl = project["links"]["Website"] as String? ?? "";
                            final String githubUrl = project["links"]["GitHub"] as String? ?? "";
                            
                            if (designUrl.isNotEmpty) {
                              desktop_launchURL(designUrl);
                            } else if (websiteUrl.isNotEmpty) {
                              desktop_launchURL(websiteUrl);
                            } else if (githubUrl.isNotEmpty) {
                              desktop_launchURL(githubUrl);
                            }
                          } else {
                            // For all other projects: Website first, then Design, then GitHub
                            final String websiteUrl = project["links"]["Website"] as String? ?? "";
                            final String designUrl = project["links"]["Design"] as String? ?? "";
                            final String githubUrl = project["links"]["GitHub"] as String? ?? "";
                            
                            if (websiteUrl.isNotEmpty) {
                              desktop_launchURL(websiteUrl);
                            } else if (designUrl.isNotEmpty) {
                              desktop_launchURL(designUrl);
                            } else if (githubUrl.isNotEmpty) {
                              desktop_launchURL(githubUrl);
                            }
                          }
                        },
                        projectName: project["name"] as String,
                        projectImage: imageUrl,
                        links: Map<String, String>.from(project["links"]),
                        width: baseItemWidth,
                        height: itemHeight,
                        useIframe: project["useIframe"] as bool? ?? false,
                        // Pass aspect ratio for optimized caching
                        aspectRatio: imageDataCache[imageUrl]?.aspectRatio,
                      );
                    },
                  ),
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
                      const TextSpan(text: " are missing, Thanks to the " ),
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
  final bool useIframe;
  final double? aspectRatio;

  const DesktopPortfolioGridItem({
    Key? key,
    required this.isDarkMode,
    this.onTap,
    required this.projectName,
    required this.projectImage,
    required this.links,
    required this.width,
    required this.height,
    required this.useIframe,
    required this.aspectRatio,
  }) : super(key: key);

  @override
  State<DesktopPortfolioGridItem> createState() =>
      _DesktopPortfolioGridItemState();
}

class _DesktopPortfolioGridItemState extends State<DesktopPortfolioGridItem>
    with TickerProviderStateMixin {
  bool isHovered = false;
  late AnimationController _shimmerController;
  late Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _shimmerAnimation = Tween<double>(begin: -1.0, end: 1.0).animate(
      CurvedAnimation(parent: _shimmerController, curve: Curves.linear),
    );
    _shimmerController.repeat();
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  // Helper method to build optimized images with proper cache sizing
  Widget _buildOptimizedImage() {
    // Calculate optimal cache dimensions based on display size and device pixel ratio
    final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;
    
    int? cacheWidth, cacheHeight;
    
    if (widget.aspectRatio != null) {
      // Determine which dimension to prioritize based on aspect ratio
      if (widget.aspectRatio! > 1.0) {
        // Wide image: prioritize height to maintain quality
        cacheHeight = (widget.height * devicePixelRatio).round();
      } else {
        // Tall or square image: prioritize width to maintain quality  
        cacheWidth = (widget.width * devicePixelRatio).round();
      }
    } else {
      // Default to width-based caching if aspect ratio unknown
      cacheWidth = (widget.width * devicePixelRatio).round();
    }

    return Container(
      decoration: BoxDecoration(
        color: widget.isDarkMode 
            ? Colors.black.withOpacity(0.3)
            : Colors.black.withOpacity(0.2),
      ),
      child: Center(
        child: Container(
          width: double.infinity,
          height: double.infinity,
          child: widget.projectImage.startsWith('http')
            ? Image.network(
                widget.projectImage,
                fit: BoxFit.cover,
                cacheWidth: cacheWidth,
                cacheHeight: cacheHeight,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    color: widget.isDarkMode 
                        ? Colors.black.withOpacity(0.3)
                        : Colors.black.withOpacity(0.2),
                    child: Center(
                      child: CircularProgressIndicator(
                        value: loadingProgress.expectedTotalBytes != null
                            ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                            : null,
                        color: widget.isDarkMode ? Colors.white : Colors.black,
                        strokeWidth: 2,
                      ),
                    ),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: widget.isDarkMode 
                        ? Colors.black.withOpacity(0.3)
                        : Colors.black.withOpacity(0.2),
                    child: Center(
                      child: Icon(
                        Icons.broken_image,
                        size: 48,
                        color: widget.isDarkMode 
                            ? Colors.white.withOpacity(0.5)
                            : Colors.black.withOpacity(0.5),
                      ),
                    ),
                  );
                },
              )
            : Image.asset(
                widget.projectImage,
                fit: BoxFit.cover,
                cacheWidth: cacheWidth,
                cacheHeight: cacheHeight,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: widget.isDarkMode 
                        ? Colors.black.withOpacity(0.3)
                        : Colors.black.withOpacity(0.2),
                    child: Center(
                      child: Icon(
                        Icons.broken_image,
                        size: 48,
                        color: widget.isDarkMode 
                            ? Colors.white.withOpacity(0.5)
                            : Colors.black.withOpacity(0.5),
                      ),
                    ),
                  );
                },
              ),
        ),
      ),
    );
  }

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
                fit: StackFit.expand,
                children: [
                  // Background color
                  Container(
                    color: widget.isDarkMode 
                        ? Colors.white.withOpacity(0.03) 
                        : Colors.black.withOpacity(0.03),
                  ),
                  
                  // Project Image or Iframe
                  Positioned.fill(
                    top: 0,
                    left: 8,
                    right: 8,
                    bottom: 35, // Further reduced for more image space
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: double.infinity,
                        height: double.infinity,
                        color: widget.isDarkMode 
                            ? Colors.black.withOpacity(0.3) // Increased opacity for darker background
                            : Colors.black.withOpacity(0.2),
                        child: widget.useIframe 
                          ? _buildGithubIframe(widget.links["GitHub"] ?? "")
                          : widget.projectImage.isEmpty
                              ? Center(
                                  child: Icon(
                                    FontAwesomeIcons.github,
                                    size: 48,
                                    color: widget.isDarkMode ? Colors.black.withOpacity(0.5) : Colors.white.withOpacity(0.5),
                                  ),
                                )
                              : _buildImageWithSkeleton(),
                      ),
                    ),
                  ),

                  // Title & links
                  Positioned(
                    bottom: 8,
                    left: 8,
                    right: 8,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Project Name
                        Expanded(
                          child: Text(
                            widget.projectName,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
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

  Widget _buildGithubIframe(String url) {
    // Create a unique ID for this iframe
    final String iframeId = 'github-iframe-${url.hashCode}';
    
    // Create the iframe element
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Only execute in web mode
      if (identical(0, 0.0)) {
        return;
      }
      
      // Remove previous iframe if it exists
      final container = html.document.getElementById(iframeId);
      if (container != null) {
        container.children.clear();
      }
      
      // Get repository path for embedding
      final repoPath = url.replaceAll('https://github.com/', '');
      
      // Create iframe HTML
      final iframe = html.IFrameElement()
        ..style.border = 'none'
        ..style.height = '100%'
        ..style.width = '100%'
        ..src = 'https://gh-card.dev/repos/$repoPath.svg?fullname=true&link_target=_blank';
      
      // Add the iframe to the DOM
      html.document.getElementById(iframeId)?.append(iframe);
    });
    
    // Return a container that will be used as a placeholder for the iframe
    return Container(
      color: Colors.transparent,
      child: Center(
        child: FaIcon(
          FontAwesomeIcons.github,
          size: 32,
          color: widget.isDarkMode ? Colors.black.withOpacity(0.3) : Colors.white.withOpacity(0.3),
        ),
      ),
    );
  }

  Widget _buildImageWithSkeleton() {
    // Calculate optimal cache dimensions based on display size and device pixel ratio
    final devicePixelRatio = MediaQuery.of(context).devicePixelRatio;
    
    int? cacheWidth, cacheHeight;
    
    if (widget.aspectRatio != null) {
      // Determine which dimension to prioritize based on aspect ratio
      if (widget.aspectRatio! > 1.0) {
        // Wide image: prioritize height to maintain quality
        cacheHeight = (widget.height * devicePixelRatio).round();
      } else {
        // Tall or square image: prioritize width to maintain quality  
        cacheWidth = (widget.width * devicePixelRatio).round();
      }
    } else {
      // Default to width-based caching if aspect ratio unknown
      cacheWidth = (widget.width * devicePixelRatio).round();
    }

    return Container(
      decoration: BoxDecoration(
        color: widget.isDarkMode 
            ? Colors.black.withOpacity(0.3)
            : Colors.black.withOpacity(0.2),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Actual image
          widget.projectImage.startsWith('http')
            ? Image.network(
                widget.projectImage,
                fit: BoxFit.cover,
                cacheWidth: cacheWidth,
                cacheHeight: cacheHeight,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return _buildSkeletonLoader();
                },
                errorBuilder: (context, error, stackTrace) {
                  return _buildErrorState();
                },
              )
            : Image.asset(
                widget.projectImage,
                fit: BoxFit.cover,
                cacheWidth: cacheWidth,
                cacheHeight: cacheHeight,
                errorBuilder: (context, error, stackTrace) {
                  return _buildErrorState();
                },
              ),
        ],
      ),
    );
  }

  Widget _buildSkeletonLoader() {
    return AnimatedBuilder(
      animation: _shimmerAnimation,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(-1.0 - _shimmerAnimation.value, -0.3),
              end: Alignment(1.0 - _shimmerAnimation.value, 0.3),
              colors: widget.isDarkMode 
                ? [
                    Colors.grey[800]!.withOpacity(0.3),
                    Colors.grey[600]!.withOpacity(0.6),
                    Colors.grey[700]!.withOpacity(0.8),
                    Colors.grey[600]!.withOpacity(0.6),
                    Colors.grey[800]!.withOpacity(0.3),
                  ]
                : [
                    Colors.grey[300]!.withOpacity(0.3),
                    Colors.grey[200]!.withOpacity(0.6),
                    Colors.white.withOpacity(0.8),
                    Colors.grey[200]!.withOpacity(0.6),
                    Colors.grey[300]!.withOpacity(0.3),
                  ],
              stops: const [0.0, 0.35, 0.5, 0.65, 1.0],
            ),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.image,
                  size: 32,
                  color: widget.isDarkMode 
                      ? Colors.white.withOpacity(0.4) 
                      : Colors.black.withOpacity(0.4),
                ),
                const SizedBox(height: 8),
                Text(
                  'Loading...',
                  style: TextStyle(
                    fontSize: 11,
                    color: widget.isDarkMode 
                        ? Colors.white.withOpacity(0.5) 
                        : Colors.black.withOpacity(0.5),
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildErrorState() {
    return Container(
      color: widget.isDarkMode 
          ? Colors.black.withOpacity(0.3)
          : Colors.black.withOpacity(0.2),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.broken_image,
              size: 48,
              color: widget.isDarkMode 
                  ? Colors.white.withOpacity(0.5)
                  : Colors.black.withOpacity(0.5),
            ),
            const SizedBox(height: 8),
            Text(
              'Image failed to load',
              style: TextStyle(
                fontSize: 10,
                color: widget.isDarkMode 
                    ? Colors.white.withOpacity(0.5)
                    : Colors.black.withOpacity(0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}