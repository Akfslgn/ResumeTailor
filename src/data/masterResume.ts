import { Resume } from "@/types/resume";

export const masterResume: Resume = {
  name: "Akif Salgın",
  email: "akif@example.com",
  phone: "+90 555 000 0000",
  location: "Istanbul, Turkey",
  linkedin: "linkedin.com/in/akifsalgin",
  github: "github.com/akifsalgin",
  website: "akifsalgin.dev",
  summary:
    "Full-stack developer with 5+ years of experience building scalable web applications. Passionate about clean code, performance optimization, and great user experiences. Experienced in React, Node.js, TypeScript, and cloud platforms.",
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "SQL", "HTML", "CSS"],
    frameworks: ["React", "Next.js", "Node.js", "Express", "NestJS", "FastAPI", "Tailwind CSS"],
    tools: ["Git", "Docker", "Webpack", "Vite", "Jest", "Cypress", "Figma"],
    databases: ["PostgreSQL", "MongoDB", "Redis", "Supabase", "Firebase"],
    cloud: ["AWS (EC2, S3, Lambda, RDS)", "Vercel", "Netlify", "GitHub Actions", "CI/CD"],
  },
  experience: [
    {
      company: "TechCorp Istanbul",
      title: "Senior Full-Stack Developer",
      location: "Istanbul, Turkey (Remote)",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Led development of a multi-tenant SaaS platform serving 50,000+ users using Next.js, Node.js, and PostgreSQL",
        "Reduced page load time by 40% through code splitting, lazy loading, and CDN optimization",
        "Architected and implemented RESTful and GraphQL APIs consumed by web and mobile clients",
        "Mentored 3 junior developers and introduced code review processes that reduced bug rate by 30%",
        "Implemented CI/CD pipelines with GitHub Actions reducing deployment time from 2 hours to 15 minutes",
      ],
    },
    {
      company: "StartupX",
      title: "Full-Stack Developer",
      location: "Istanbul, Turkey",
      startDate: "Jun 2020",
      endDate: "Dec 2021",
      bullets: [
        "Built and maintained 5+ React-based web applications with TypeScript for e-commerce clients",
        "Developed Node.js microservices integrating third-party payment, SMS, and email providers",
        "Migrated legacy jQuery codebase to React, improving developer velocity by 60%",
        "Collaborated with UI/UX designers to implement pixel-perfect, responsive interfaces",
        "Integrated AWS S3-based file upload system handling 10GB+ of assets daily",
      ],
    },
    {
      company: "Freelance",
      title: "Frontend Developer",
      location: "Remote",
      startDate: "Jan 2019",
      endDate: "May 2020",
      bullets: [
        "Delivered 10+ websites and web applications for clients across e-commerce, healthcare, and media sectors",
        "Implemented SEO optimizations resulting in 3x organic traffic increase for a news portal client",
        "Worked with React, Vue.js, and vanilla JavaScript based on project requirements",
      ],
    },
  ],
  education: [
    {
      school: "Istanbul Technical University",
      degree: "Bachelor of Science",
      field: "Computer Engineering",
      graduationDate: "June 2019",
      gpa: "3.4/4.0",
    },
  ],
  projects: [
    {
      name: "OpenTask",
      description:
        "Open-source project management tool with real-time collaboration, drag-and-drop boards, and team analytics",
      technologies: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Socket.io"],
      url: "github.com/akifsalgin/opentask",
    },
    {
      name: "PriceRadar",
      description:
        "Price tracking SaaS that monitors e-commerce sites and sends alerts when prices drop",
      technologies: ["Node.js", "Puppeteer", "Redis", "React", "AWS Lambda"],
      url: "github.com/akifsalgin/priceradar",
    },
  ],
};
