import { Request, Response } from 'express';
import { searchJobs, searchLinkedInWithDescriptions, scrapeJobUrl } from '../services/scraperService';

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, location = '', page = 1, remoteOnly = false } = req.body as {
      query: string; location?: string; page?: number; remoteOnly?: boolean;
    };
    if (!query) {
      res.status(400).json({ error: 'Search query required' });
      return;
    }
    const jobs = await searchJobs(query, { location, page: Number(page), remoteOnly: Boolean(remoteOnly) });
    res.json({ count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const linkedinSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      query, location = '', page = 1,
      remoteFilter = [], jobType = [], experienceLevel = [],
      dateSincePosted = 'past week', sortBy = 'recent',
    } = req.body as {
      query: string; location?: string; page?: number;
      remoteFilter?: string | string[]; jobType?: string | string[];
      experienceLevel?: string | string[]; dateSincePosted?: string; sortBy?: string;
    };
    if (!query) {
      res.status(400).json({ error: 'Search query required' });
      return;
    }
    const jobs = await searchLinkedInWithDescriptions(query, {
      location, page: Number(page), remoteFilter, jobType, experienceLevel, dateSincePosted, sortBy,
    });
    res.json({ count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const scrape = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body as { url: string };
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ error: 'Valid URL required' });
      return;
    }
    const data = await scrapeJobUrl(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape: ' + (err as Error).message });
  }
};
