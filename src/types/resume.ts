export interface ResumeExperience {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface Resume {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary: string;
  skills: Record<string, string[]>;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  sectionTitles?: Record<string, string>;
  sectionOrder?: string[];
}
