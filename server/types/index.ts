import { Document, Types } from 'mongoose';
import { Request } from 'express';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  matchPassword(entered: string): Promise<boolean>;
}

export interface IProfile extends Document {
  user: Types.ObjectId;
  fullName?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsExperience: number;
  currentRole?: string;
  currentCompany?: string;
  resumeSummary: string;
  keyAchievements: string[];
  techStack: string[];
  preferences: {
    targetRoles: string[];
    locations: string[];
    remoteOnly: boolean;
  };
}

export interface IApplication extends Document {
  user: Types.ObjectId;
  company: string;
  role: string;
  location?: string;
  jobLink?: string;
  jobDescription?: string;
  status: 'Saved' | 'Applied' | 'Referral Sent' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';
  referralContact?: string;
  followUpDate?: Date;
  notes?: string;
  generatedMessages?: {
    coldEmail?: { subject?: string; body?: string };
    linkedinNote?: string;
    referralMessage?: string;
    indeedPara?: string;
  };
  appliedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user: IUser;
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

export interface GeneratedMessages {
  emailSubject: string;
  emailBody: string;
  linkedinNote: string;
  referralMessage: string;
  indeedPara: string;
}

export interface ProfileForAI {
  fullName?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  currentRole?: string;
  currentCompany?: string;
  yearsExperience?: number;
  techStack?: string[];
  resumeSummary?: string;
  keyAchievements?: string[];
}
