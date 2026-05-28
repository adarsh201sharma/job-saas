import Groq from 'groq-sdk';
import { GeneratedMessages, ProfileForAI } from '../types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJSON<T>(raw: string, label: string): T {
  console.log(`[${label}] raw (first 800):`, raw.slice(0, 800));
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error(`${label} no JSON found`);
    throw new Error(`Failed to parse ${label}`);
  }
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch (err) {
    console.error(`${label} JSON.parse error:`, (err as Error).message);
    console.error(`${label} slice:`, raw.slice(start, start + 800));
    throw new Error(`Failed to parse ${label}`);
  }
}

export async function generateMessages(
  profile: ProfileForAI,
  jobDescription: string,
  jobLink?: string,
): Promise<GeneratedMessages> {
  const name = profile.fullName || 'Candidate';
  const role = profile.currentRole || '';
  const company = profile.currentCompany || '';
  const exp = profile.yearsExperience || 0;
  const stack = (profile.techStack || []).join(', ');
  const achievements = (profile.keyAchievements || []).slice(0, 4).join('\n- ');
  const summary = profile.resumeSummary || '';
  const email = profile.email || '';
  const phone = profile.phone || '';
  const linkedin = profile.linkedinUrl || '';
  const github = profile.githubUrl || '';

  const prompt = `You are a world-class job application ghostwriter. Write sharp, human, and tailored messages — not generic templates.

## CANDIDATE
Name: ${name}
Current: ${role}${company ? ` @ ${company}` : ''}
Experience: ${exp} years
Stack: ${stack}
Summary: ${summary}
Top achievements:
- ${achievements}
Contact: ${email}${phone ? ` | ${phone}` : ''}${linkedin ? ` | ${linkedin}` : ''}${github ? ` | ${github}` : ''}

## JOB DESCRIPTION
${jobDescription.slice(0, 3000)}

## JOB LINK
${jobLink || 'not provided'}

## INSTRUCTIONS
Write 4 distinct messages. Each must directly reference specific requirements, tools, or phrases from the JD above — not generic language.

emailSubject: One sharp line. Format: "[Role] — [Name] | [1 standout hook]". No fluff.

emailBody: 130–160 words max. Structure:
Line 1: Strong opening hook tied to a specific JD requirement or company detail.
Then 3–4 bullet points (use • symbol), each mapping one of the candidate's real achievements to a specific JD requirement. Be concrete.
Closing: One sentence CTA. Then signature with name and contact.
No "I am writing to express" or "I came across your posting" clichés.

linkedinNote: Max 290 characters. No greeting. Start with a bold claim or shared context. Name-drop 2 JD-specific skills/tools. End with a soft CTA. Count characters carefully — must be under 290.

referralMessage: 3–4 casual sentences to a contact at the company. Mention the specific role, why you're a fit (1–2 points), and ask for a referral. Include the job link if provided. Sound like a real person, not a cover letter.

indeedPara: 2–3 sentences. No greeting. Lead with your strongest match to the JD. End with a confident, specific closing. Under 80 words.

Output valid JSON only:
{
  "emailSubject": "...",
  "emailBody": "...",
  "linkedinNote": "...",
  "referralMessage": "...",
  "indeedPara": "..."
}`;

  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });
  const raw = chat.choices[0].message.content ?? '';
  return extractJSON<GeneratedMessages>(raw, 'AI response');
}

export interface ParsedResume {
  fullName: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  currentRole: string;
  currentCompany: string;
  yearsExperience: number;
  techStack: string[];
  resumeSummary: string;
  keyAchievements: string[];
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const prompt = `You are a resume parser. Extract structured information from the resume text below.
Return ONLY valid JSON, no markdown fences, no preamble.

RESUME TEXT:
${resumeText}

Required JSON structure:
{
  "fullName": "candidate's full name",
  "phone": "phone number or empty string",
  "location": "city, state/country or empty string",
  "linkedinUrl": "linkedin URL or empty string",
  "githubUrl": "github URL or empty string",
  "currentRole": "most recent job title or empty string",
  "currentCompany": "most recent employer or empty string",
  "yearsExperience": 0,
  "techStack": ["array", "of", "technologies"],
  "resumeSummary": "2-3 sentence professional summary",
  "keyAchievements": ["one achievement per entry", "3-6 entries"]
}

Rules:
- Only extract what is actually present — use empty string or empty array for missing fields
- yearsExperience: integer, calculate from earliest work experience to now, round down
- techStack: include programming languages, frameworks, databases, cloud platforms, tools
- keyAchievements: pick the most impactful bullet points, keep them concise`;

  const chat = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });
  const raw = chat.choices[0].message.content ?? '';
  return extractJSON<ParsedResume>(raw, 'resume');
}
