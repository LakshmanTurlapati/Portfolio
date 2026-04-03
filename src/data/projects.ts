export interface Project {
  name: string;
  image: string;
  links: Record<string, string>;
  useIframe?: boolean;
}

// First 2 are pinned (always shown first), rest are shuffled on each render
export const pinnedProjects: Project[] = [
  { name: "Software 3.0", image: "/assets/s3.png", links: { Website: "https://www.software-3.com", GitHub: "https://github.com/LakshmanTurlapati/Software-3.0" } },
  { name: "Review Gate", image: "/assets/review_gate.webp", links: { GitHub: "https://github.com/LakshmanTurlapati/Review-Gate" } },
];

export const shuffleableProjects: Project[] = [
  { name: "EatSight", image: "/assets/estsight.png", links: { Website: "https://eatsight.fly.dev", GitHub: "https://github.com/LakshmanTurlapati/EatSight" } },
  { name: "Blockchain Smartcontracts", image: "/assets/blockchain.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/Blockchain" } },
  { name: "Smart Fabric using IOT", image: "/assets/sfuit.jpg", links: { Website: "https://www.youtube.com/watch?v=AkKRSgQnT_c", GitHub: "https://github.com/prateek10201/sfuit-esp8266" } },
  { name: "Portfolio", image: "/assets/portfolio.jpg", links: { Website: "https://audienclature.com", GitHub: "https://github.com/LakshmanTurlapati/Portfolio", Design: "https://www.figma.com/design/UeixAHUPLTSKiwHR9HVfT2/Portfolio?node-id=0-1&t=QkxcB16bQkJ96mpv-1" } },
  { name: "Financial Inclusion", image: "/assets/fi.png", links: { Website: "https://docs.google.com/document/d/1cq1xeUpl-lst5bj4376_QhCSo7HIc1EvPecKw0cmQGc/edit?usp=sharing", GitHub: "https://github.com/LakshmanTurlapati/Financial-Inclusion-v2", Design: "https://www.figma.com/design/5kNlAtt2Hh6NTx2YAPLhIu/Financial-Inclusion?node-id=0-1&t=jnAr4kRmQeHKDdOg-1" } },
  { name: "LinkedIn Auto Connect", image: "/assets/linkedin.png", links: { Website: "https://chromewebstore.google.com/detail/linkedin-auto-connect/jomecnphbmfpkcajfhkoebgmbcbakjoa?authuser=1&hl=en&pli=1", GitHub: "https://github.com/LakshmanTurlapati/linkedin-autoconnect-extension/tree/main" } },
  { name: "Service Portal", image: "/assets/chd.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Church-Dwight-Solution-Center", Design: "https://www.figma.com/design/Lj0O8tBvyuGSx3LePBCuO1/C%26D?node-id=0-1&t=QO284B9qHF3brzcH-1" } },
  { name: "X-Read", image: "", links: { GitHub: "https://github.com/LakshmanTurlapati/DCTE-Script" }, useIframe: true },
  { name: "Heartline", image: "/assets/heartline.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Heartline" } },
  { name: "Lucent", image: "/assets/lucent.png", links: { Website: "https://monumental-granita-08d2f5.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/Lucent" } },
  { name: "Parz-AI", image: "/assets/parz_ai.png", links: { GitHub: "https://github.com/LakshmanTurlapati/Parz-AI" } },
  { name: "awsxUTD-Hackathon", image: "/assets/hackathon.png", links: { GitHub: "https://github.com/LakshmanTurlapati/awsxUTD-Hackathon" } },
  { name: "T2S CLI", image: "/assets/t2s_cli.png", links: { GitHub: "https://github.com/LakshmanTurlapati/t2s-cli" } },
  { name: "Star-Trail-Flutter", image: "/assets/startrail.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/Star-Trail-Flutter" } },
  { name: "awsxutd", image: "/assets/awsxutd.png", links: { Website: "https://marvelous-sopapillas-cf2910.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/awsxutd" } },
  { name: "Open-API", image: "/assets/open_api.png", links: { GitHub: "https://github.com/LakshmanTurlapati/open-api" } },
  { name: "ArtScii", image: "/assets/artscii.jpg", links: { GitHub: "https://github.com/LakshmanTurlapati/ArtScii" } },
  { name: "FSB", image: "/assets/fsb.png", links: { GitHub: "https://github.com/LakshmanTurlapati/FSB" } },
  { name: "Asteroids Game", image: "/assets/asteroids.png", links: { Website: "https://harmonious-caramel-3c3627.netlify.app", GitHub: "https://github.com/LakshmanTurlapati/Atari-Astroids-Multiplayer" } },
  { name: "ProKeys", image: "/assets/prokeys.png", links: { GitHub: "https://github.com/LakshmanTurlapati/ProKeys" } },
  { name: "SmolLM Flutter", image: "/assets/smollm_flutter.png", links: { GitHub: "https://github.com/LakshmanTurlapati/SmolLm-Flutter" } },
];
