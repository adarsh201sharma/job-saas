# 🚀 JobJet — AI Job Application SaaS

A complete MERN-stack SaaS for automating your job hunt:

- 🔍 **Search jobs** across LinkedIn, Indeed, Glassdoor (via JSearch API)
- 🤖 **AI-generated messages** — cold emails, LinkedIn notes, referrals, Indeed paragraphs
- 🌐 **Direct URL scraping** — paste any job URL to auto-extract the description
- 📊 **Application tracker** — Kanban-style status tracking
- 👤 **Personalized** — Uses your resume profile for tailored outputs

## 🏗️ Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT auth, Anthropic Claude API, Puppeteer
**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or [free Atlas cluster](https://www.mongodb.com/cloud/atlas))
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- **RapidAPI key** for JSearch — [free signup](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) (200 requests/month free)

## ⚙️ Setup

### 1. Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your keys
npm run dev
```

Server starts at `http://localhost:5000`

### 2. Frontend
```bash
cd client
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

## 🔑 Environment Variables (.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobsaas
JWT_SECRET=your_random_string_here
ANTHROPIC_API_KEY=sk-ant-xxxxx
RAPIDAPI_KEY=your_rapidapi_key
CLIENT_URL=http://localhost:5173
```

## 🎯 How to Use

1. **Sign up** → Complete your profile (resume summary, tech stack, achievements)
2. **Find Jobs** → Search by role + location, results from real job boards
3. **Generate** → Click any job → AI creates 4 tailored messages
4. **Track** → Save as application, update status as you move through interviews

## 🕸️ About Web Scraping

**Important:** Major job boards (LinkedIn, Indeed) actively block scrapers. This project uses two approaches:

1. **JSearch API (recommended)** — Legal aggregator that returns LinkedIn/Indeed jobs via proper API
2. **Puppeteer URL scraper** — For pasting direct URLs from job pages that don't require auth

LinkedIn's `robots.txt` disallows scraping and they have aggressive anti-bot detection. **Do not scrape LinkedIn directly** — use JSearch instead.

## 📂 Project Structure

```
job-saas/
├── server/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User, Profile, Application
│   ├── middleware/auth.js        # JWT verification
│   ├── controllers/              # Business logic
│   ├── services/
│   │   ├── aiService.js          # Claude API integration
│   │   └── scraperService.js     # JSearch + Puppeteer
│   ├── routes/                   # REST API endpoints
│   └── server.js                 # Express entry point
└── client/
    ├── src/
    │   ├── api/axios.js          # API client with auth
    │   ├── context/AuthContext   # Auth state
    │   ├── pages/                # Dashboard, Generator, JobSearch, etc.
    │   └── components/Navbar
    └── vite.config.js
```

## 🛣️ Roadmap Ideas

- [ ] Email integration (send directly via Gmail API)
- [ ] Chrome extension for one-click apply from LinkedIn
- [ ] Resume optimizer (ATS keyword analysis)
- [ ] Interview prep AI based on saved JD
- [ ] Auto follow-up scheduler
- [ ] Salary insights & negotiation helper

## 📄 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET/PUT | `/api/profile` | Get/update profile |
| POST | `/api/jobs/search` | Search jobs |
| POST | `/api/jobs/scrape` | Scrape job URL |
| POST | `/api/messages/generate` | Generate AI messages |
| GET/POST/PATCH/DELETE | `/api/applications` | CRUD applications |
| GET | `/api/applications/stats/summary` | Get counts by status |

## 🚢 Deploy

**Backend:** Railway, Render, or Fly.io (free tiers available)
**Frontend:** Vercel, Netlify (free)
**Database:** MongoDB Atlas (free 512MB cluster)

## 📝 License

MIT — feel free to use, modify, and ship as your own SaaS!

---

Built by Adarsh Sharma 🛠️
