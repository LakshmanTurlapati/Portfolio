export interface ExperienceEntry {
  timeline: string;
  title: string;
  company: string;
  descriptions: string[];
  skills: string[];
  url?: string;
}

export const experienceData: ExperienceEntry[] = [
  {
    timeline: "2026 - Present",
    title: "AI Enablement Engineer",
    company: "InfiniteChoice",
    descriptions: [
      "Building Voyza, an AI-first hotel booking platform, with a public-safe focus on practical AI enablement, product workflows, and user-facing intelligence.",
    ],
    skills: ["AI Enablement", "Product Engineering", "AI Workflows", "Full-Stack"],
    url: "https://www.linkedin.com/company/infinitechoice/",
  },
  {
    timeline: "June 2025 - December 2025",
    title: "AI/ML Intern",
    company: "Rocket Mortgage (formerly Mr.Cooper)",
    descriptions: [
      "Developing AI agents with Google ADK and Vertex AI to automate manual application processes, leveraging NLP and machine learning for efficient, user-friendly solutions.",
    ],
    skills: ["Google ADK", "Vertex AI", "NLP", "GCP"],
    url: "https://www.linkedin.com/company/mrcoopermortgage/posts/?feedView=all",
  },
  {
    timeline: "2022 - 2024",
    title: "Software Developer",
    company: "Church & Dwight",
    descriptions: [
      "Designed and developed a Service Portal using Figma for UI design and Angular on the ServiceNow platform, focusing on improving its user interface and experience.",
      "Implemented solutions using server-side scripts like Business Rules and Script Includes, created Scripted REST APIs, and integrated Workday to automate user onboarding and off-boarding processes.",
    ],
    skills: ["ServiceNow", "Angular", "JavaScript", "Flutter"],
    url: "https://churchdwight.com/",
  },
  {
    timeline: "2020 - 2021",
    title: "Full-Stack Developer (Freelance)",
    company: "Revv Digital",
    descriptions: [
      "Developed custom web applications using the MEAN Stack, crafting dynamic user interfaces with Angular and back-end services with Node.js and Express.js.",
      "Database management with MongoDB and deployed solutions on AWS to digital marketing initiatives.",
    ],
    skills: ["MEAN Stack", "AWS", "JavaScript", "Figma"],
  },
  {
    timeline: "Jan - Apr 2019",
    title: "Machine Learning Intern",
    company: "Coign Pvt Ltd",
    descriptions: [
      "Assisted in developing a Movie Recommendation System for a streaming service, learning to use Machine Learning techniques with Python and TensorFlow for model training and data processing to deliver personalized content suggestions.",
    ],
    skills: ["Python", "TensorFlow"],
    url: "https://www.linkedin.com/company/coign-edu-&-it-services-pvt-ltd-/",
  },
];
