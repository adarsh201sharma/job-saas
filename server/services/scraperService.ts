import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job } from '../types';

const LI_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.linkedin.com/jobs',
  'X-Requested-With': 'XMLHttpRequest',
};

const DATE_MAP: Record<string, string> = {
  '24hr': 'r86400',
  'past week': 'r604800',
  'past month': 'r2592000',
};
const REMOTE_MAP: Record<string, string>   = { 'on-site': '1', remote: '2', hybrid: '3' };
const JOB_TYPE_MAP: Record<string, string> = { 'full time': 'F', 'part time': 'P', contract: 'C', temporary: 'T', volunteer: 'V', internship: 'I' };
const EXP_MAP: Record<string, string>      = { internship: '1', 'entry level': '2', associate: '3', 'mid-senior level': '4', director: '5', executive: '6' };
const SORT_MAP: Record<string, string>     = { recent: 'DD', relevant: 'R' };

interface SearchOptions {
  location?: string;
  start?: number;
  remoteFilter?: string | string[];
  jobType?: string | string[];
  experienceLevel?: string | string[];
  dateSincePosted?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  remoteOnly?: boolean;
}

interface RawJob {
  position: string;
  company: string;
  location: string;
  date: string | null;
  agoTime: string;
  jobUrl: string;
  companyLogo: string | null;
}

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  link: string;
}

function buildLinkedInSearchUrl(query: string, opts: SearchOptions = {}): string {
  const {
    location = '', start = 0, remoteFilter = '', jobType = '',
    experienceLevel = '', dateSincePosted = '', sortBy = 'recent',
  } = opts;

  const params = new URLSearchParams();
  if (query)    params.set('keywords', query);
  if (location) params.set('location', location);

  const customSeconds = Number(dateSincePosted);
  if (!isNaN(customSeconds) && customSeconds > 0) {
    params.set('f_TPR', `r${customSeconds}`);
  } else if (DATE_MAP[dateSincePosted]) {
    params.set('f_TPR', DATE_MAP[dateSincePosted]);
  }

  const remoteVals = ([] as string[]).concat(remoteFilter).filter(Boolean).map(v => REMOTE_MAP[v]).filter(Boolean);
  if (remoteVals.length) params.set('f_WT', remoteVals.join(','));

  const jobTypeVals = ([] as string[]).concat(jobType).filter(Boolean).map(v => JOB_TYPE_MAP[v]).filter(Boolean);
  if (jobTypeVals.length) params.set('f_JT', jobTypeVals.join(','));

  const expVals = ([] as string[]).concat(experienceLevel).filter(Boolean).map(v => EXP_MAP[v]).filter(Boolean);
  if (expVals.length) params.set('f_E', expVals.join(','));

  if (SORT_MAP[sortBy]) params.set('sortBy', SORT_MAP[sortBy]);
  params.set('start', String(start));

  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`;
}

function parseLinkedInJobList(html: string): RawJob[] {
  const $ = cheerio.load(html);
  return $('li').map((_, el) => {
    const job = $(el);
    const position = job.find('.base-search-card__title').text().trim();
    const company  = job.find('.base-search-card__subtitle').text().trim();
    if (!position || !company) return null;
    return {
      position,
      company,
      location:    job.find('.job-search-card__location').text().trim(),
      date:        job.find('time').attr('datetime') ?? null,
      agoTime:     job.find('.job-search-card__listdate').text().trim(),
      jobUrl:      job.find('.base-card__full-link').attr('href') ?? '',
      companyLogo: job.find('.artdeco-entity-image').attr('data-delayed-url') ?? null,
    } as RawJob;
  }).get().filter(Boolean) as RawJob[];
}

async function fetchLinkedInPage(query: string, options: SearchOptions = {}): Promise<RawJob[]> {
  const url = buildLinkedInSearchUrl(query, options);
  try {
    const { data } = await axios.get<string>(url, { headers: LI_HEADERS, timeout: 12000 });
    return parseLinkedInJobList(data);
  } catch (err) {
    console.error('LinkedIn fetch error:', (err as Error).message);
    return [];
  }
}

async function searchLinkedIn(query: string, opts: SearchOptions = {}): Promise<Job[]> {
  const { location = '', page = 1, remoteFilter = '', jobType = '', experienceLevel = '', dateSincePosted = 'past week', sortBy = 'recent', limit = 15 } = opts;
  const start = (page - 1) * limit;
  const raw = await fetchLinkedInPage(query, { location, start, remoteFilter, jobType, experienceLevel, dateSincePosted, sortBy });

  return raw.slice(0, limit).map(job => ({
    id:             `li_${job.jobUrl.split('/').filter(Boolean).pop() ?? Math.random()}`,
    title:          job.position,
    company:        job.company,
    companyLogo:    job.companyLogo,
    location:       job.location,
    remote:         (Array.isArray(remoteFilter) ? remoteFilter.includes('remote') : remoteFilter === 'remote') || job.location.toLowerCase().includes('remote'),
    employmentType: Array.isArray(jobType) ? jobType.join(', ') : (jobType || ''),
    description:    '',
    link:           job.jobUrl,
    postedAt:       job.date,
    agoTime:        job.agoTime,
    salary:         null,
    source:         'LinkedIn' as const,
  }));
}

async function scrapeLinkedInDescription(jobUrl: string): Promise<string> {
  try {
    const match = jobUrl.match(/(\d{7,})(?:\?|\/|$)/);
    const jobId = match ? match[1] : null;

    if (jobId) {
      const guestUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
      const { data: html } = await axios.get<string>(guestUrl, { headers: LI_HEADERS, timeout: 10000 });
      const $ = cheerio.load(html);
      const desc = $('.show-more-less-html__markup').text().trim() || $('.description__text').text().trim();
      if (desc) return desc;
    }

    const { data: html } = await axios.get<string>(jobUrl, { headers: LI_HEADERS, timeout: 10000 });
    const $ = cheerio.load(html);
    return (
      $('.show-more-less-html__markup').text().trim() ||
      $('.description__text').text().trim() ||
      $('[class*="description"]').first().text().trim()
    );
  } catch {
    return '';
  }
}

async function searchJSearchAPI(query: string, opts: SearchOptions = {}): Promise<Job[]> {
  if (!process.env.RAPIDAPI_KEY) return [];
  const { location = '', page = 1, remoteOnly = false } = opts;
  try {
    const q = location ? `${query} in ${location}` : query;
    const { data } = await axios.request<{ data: Record<string, unknown>[] }>({
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: { query: q, page: String(page), num_pages: '1', date_posted: 'week', remote_jobs_only: remoteOnly ? 'true' : 'false' },
      headers: { 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
    });
    return (data.data || []).map(job => ({
      id:             job.job_id as string,
      title:          job.job_title as string,
      company:        job.employer_name as string,
      companyLogo:    job.employer_logo as string | null,
      location:       [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
      remote:         job.job_is_remote as boolean,
      employmentType: job.job_employment_type as string,
      description:    job.job_description as string,
      link:           job.job_apply_link as string,
      postedAt:       job.job_posted_at_datetime_utc as string | null,
      salary:         (job.job_min_salary && job.job_max_salary)
        ? `${job.job_salary_currency || ''} ${job.job_min_salary} - ${job.job_max_salary}`
        : null,
      source:         'JSearch' as const,
    }));
  } catch (err) {
    console.error('JSearch error:', (err as Error).message);
    return [];
  }
}

export async function searchJobs(query: string, options: SearchOptions = {}): Promise<Job[]> {
  const [jsearchJobs, linkedInJobs] = await Promise.all([
    searchJSearchAPI(query, options),
    searchLinkedIn(query, options),
  ]);

  const toFetch = linkedInJobs.slice(0, 10);
  const descs = await Promise.all(toFetch.map(j => j.link ? scrapeLinkedInDescription(j.link) : ''));
  toFetch.forEach((j, i) => { j.description = descs[i]; });

  const merged: Job[] = [];
  const max = Math.max(linkedInJobs.length, jsearchJobs.length);
  for (let i = 0; i < max; i++) {
    if (i < linkedInJobs.length) merged.push(linkedInJobs[i]);
    if (i < jsearchJobs.length)  merged.push(jsearchJobs[i]);
  }
  return merged;
}

export async function searchLinkedInWithDescriptions(query: string, options: SearchOptions = {}): Promise<Job[]> {
  const jobs = await searchLinkedIn(query, options);
  const toFetch = jobs.slice(0, 10);
  const descs = await Promise.all(toFetch.map(j => j.link ? scrapeLinkedInDescription(j.link) : ''));
  toFetch.forEach((j, i) => { j.description = descs[i]; });
  return jobs;
}

export async function scrapeJobUrl(url: string): Promise<ScrapedJob> {
  if (url.includes('linkedin.com')) {
    const description = await scrapeLinkedInDescription(url);
    if (description) return { description, link: url, title: '', company: '', location: '' };
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const puppeteer = require('puppeteer') as typeof import('puppeteer');
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const data = await page.evaluate(/* istanbul ignore next */ () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      // @ts-ignore — runs in browser context via Puppeteer
      const doc = document as any;
      const getText = (sels: string[]): string => {
        for (const s of sels) {
          const el = doc.querySelector(s);
          if (el?.innerText?.trim()) return el.innerText.trim();
        }
        return '';
      };
      return {
        title:       getText(['h1.jobsearch-JobInfoHeader-title', 'h1[data-test="job-title"]', 'h1']),
        company:     getText(['[data-company-name="true"]', '.topcard__org-name-link', '[data-test="employer-name"]']),
        location:    getText(['[data-test="job-location"]', '.topcard__flavor--bullet', '.location']),
        description: getText(['#jobDescriptionText', '.description__text', 'article', 'main']) || doc.body.innerText.slice(0, 5000),
      };
    });
    return { ...data, link: url };
  } finally {
    if (browser) await browser.close();
  }
}
