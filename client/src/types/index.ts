export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  remote: boolean;
  employmentType: string;
  description: string;
  link: string;
  postedAt: string | null;
  agoTime?: string;
  salary: string | null;
  source: 'LinkedIn' | 'JSearch';
}

export interface Application {
  _id: string;
  company: string;
  role: string;
  location?: string;
  jobLink?: string;
  jobDescription?: string;
  status: 'Saved' | 'Applied' | 'Referral Sent' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';
  createdAt: string;
  appliedDate?: string;
}

export interface Profile {
  _id?: string;
  fullName?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsExperience?: number;
  currentRole?: string;
  currentCompany?: string;
  resumeSummary?: string;
  keyAchievements?: string[];
  techStack?: string[];
}

export interface GeneratedMessages {
  emailSubject: string;
  emailBody: string;
  linkedinNote: string;
  referralMessage: string;
  indeedPara: string;
}

export interface StatsResponse {
  total: number;
  byStatus: { _id: string; count: number }[];
}
