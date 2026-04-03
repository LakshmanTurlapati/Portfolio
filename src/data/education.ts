export interface EducationEntry {
  timeline: string;
  title: string;
  institution: string;
  skills: string[];
  url: string;
}

export const educationData: EducationEntry[] = [
  {
    timeline: "2024 - 2026",
    title: "University of Texas at Dallas",
    institution: "Master's Degree - Information Technology and Management",
    skills: ["GPA: 3.9 / 4.0"],
    url: "https://www.utdallas.edu/",
  },
  {
    timeline: "2018 - 2022",
    title: "Osmania University",
    institution: "Bachelor's Degree - Computer Science",
    skills: ["GPA: 3.5 / 4.0"],
    url: "https://www.linkedin.com/school/osmania-university/",
  },
];
