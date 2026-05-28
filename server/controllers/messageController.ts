import { Request, Response } from 'express';
import Profile from '../models/Profile';
import Application from '../models/Application';
import { generateMessages } from '../services/aiService';
import { ProfileForAI } from '../types';

export const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobDescription, jobLink, company, role, location, saveAsApplication } = req.body as {
      jobDescription: string; jobLink?: string; company?: string;
      role?: string; location?: string; saveAsApplication?: boolean;
    };
    if (!jobDescription) {
      res.status(400).json({ error: 'Job description required' });
      return;
    }

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      res.status(400).json({ error: 'Please complete your profile first' });
      return;
    }

    const profileForAI: ProfileForAI = {
      ...profile.toObject(),
      email: req.user.email,
    };
    const messages = await generateMessages(profileForAI, jobDescription, jobLink);

    let savedApp = null;
    if (saveAsApplication && company && role) {
      savedApp = await Application.create({
        user: req.user._id,
        company,
        role,
        location,
        jobLink,
        jobDescription,
        status: 'Saved',
        generatedMessages: {
          coldEmail:       { subject: messages.emailSubject, body: messages.emailBody },
          linkedinNote:    messages.linkedinNote,
          referralMessage: messages.referralMessage,
          indeedPara:      messages.indeedPara,
        },
      });
    }

    res.json({ messages, application: savedApp });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
