const OpenAI = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_TEXT_LENGTH = 12000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfName = file.originalname?.toLowerCase().endsWith('.pdf');
    if (!isPdfMime && !isPdfName) {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Resume PDF must be 5MB or smaller' });
    }

    return res.status(400).json({ error: err.message || 'Invalid file upload' });
  });
};

const extractResumeText = async (file) => {
  if (!file) return '';
  const parsed = await pdfParse(file.buffer);
  const cleanedText = (parsed.text || '').replace(/\s+/g, ' ').trim();
  if (!cleanedText) {
    throw new Error('Could not extract readable text from uploaded PDF');
  }
  return cleanedText.slice(0, MAX_RESUME_TEXT_LENGTH);
};

const makeJobKey = ({ title = '', company = '', location = '' }) =>
  `${title}|${company}|${location}`.toLowerCase().replace(/\s+/g, ' ').trim();

const makeSearchJobUrl = ({ title = '', company = '', location = '' }) => {
  const query = [title, company, location].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' jobs')}`;
};

const normalizeJob = (job) => {
  const title = (job.title || '').trim();
  const company = (job.company || '').trim();
  const location = (job.location || '').trim();
  const url = (job.jobUrl || '').trim();

  return {
    ...job,
    title,
    company,
    location,
    jobUrl: url || makeSearchJobUrl({ title, company, location }),
    jobKey: makeJobKey({ title, company, location }),
  };
};

const getSavedKeySet = (userId) => {
  const rows = db.prepare('SELECT job_key FROM saved_jobs WHERE user_id = ?').all(userId);
  return new Set(rows.map((row) => row.job_key));
};

async function fetchAdzunaJobs({ query, location }) {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/us/search/1/`);

  url.searchParams.append("app_id", process.env.ADZUNA_APP_ID);
  url.searchParams.append("app_key", process.env.ADZUNA_APP_KEY);
  url.searchParams.append("what", query);
  url.searchParams.append("where", location);
  url.searchParams.append("results_per_page", 5);

  const res = await fetch(url);
  const data = await res.json();

  return data.results.slice(0, 5).map(job => ({
    title: job.title,
    company: job.company?.display_name,
    location: job.location?.display_name,
    jobUrl: job.redirect_url,
    description: (job.description || "").slice(0, 300)
  }));
}

const findMatches = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { jobType, location, experienceLevel } = req.body;
    const pastedResumeText = (req.body.resumeText || '').trim();
    const uploadedResumeText = await extractResumeText(req.file);
    const combinedResumeText = [pastedResumeText, uploadedResumeText].filter(Boolean).join('\n\n');
    const resumeText = combinedResumeText.slice(0, MAX_RESUME_TEXT_LENGTH);

    const prompt = `You are a job search assistant.

    Based on this resume and preferences, generate a job search query optimized for a job API.
    Do not include location in "query". Only include location in "location"

    Resume:
    ${resumeText || 'No resume provided'}

    Preferences:
    - Job Type: ${jobType || 'Any'}
    - Location: ${location || 'Any'}
    - Experience Level: ${experienceLevel || 'Any'}

    Return JSON:
    {
      "query": "job title",
      "location": "city or region"
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;

    console.log(content)

    const { query, location: queryLocation } = JSON.parse(content);
    const finalQuery = query || jobType || "software engineer";
    const finalLocation = queryLocation || location || "United States";

    const adzunaJobs = await fetchAdzunaJobs({
      query: finalQuery,
      location: finalLocation
    });

    const scoringPrompt = `You are a job matching assistant.

    Resume:
    ${resumeText || 'No resume provided'}

    Jobs:
    ${JSON.stringify(adzunaJobs, null, 2)}

    Return a JSON array of the SAME jobs with added fields:

    - title
    - company
    - location
    - jobUrl
    - matchScore (70–97, varied)
    - skills (3–5)
    - requiredSkills (3–5)
    - whyMatch (1 sentence)
    - keywordMatch { matched, total } (8–15 total, matched < total)

    Only return JSON.`;

    const scoredResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: scoringPrompt }],
      temperature: 0.7,
    });

    const parsedJobs = JSON.parse(scoredResponse.choices[0].message.content);

    console.log(parsedJobs)

    const savedKeys = getSavedKeySet(req.user.id);
    const jobs = parsedJobs.map((job) => {
      const normalized = normalizeJob(job);
      return { ...normalized, saved: savedKeys.has(normalized.jobKey) };
    });
    res.json({ jobs });
  } catch (err) {
    console.error(err);
    if (err.message === 'Could not extract readable text from uploaded PDF') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to find matches' });
  }
};

const saveMatch = (req, res) => {
  const { title, company, location, matchScore, jobUrl, skills, requiredSkills, whyMatch, keywordMatch } = req.body;

  if (!title || !company) {
    return res.status(400).json({ error: 'title and company are required' });
  }

  const normalized = normalizeJob({ title, company, location, matchScore, jobUrl, skills, requiredSkills, whyMatch, keywordMatch });
  const payload = JSON.stringify({
    title: normalized.title,
    company: normalized.company,
    location: normalized.location,
    matchScore: normalized.matchScore,
    jobUrl: normalized.jobUrl,
    skills: skills || [],
    requiredSkills: requiredSkills || [],
    whyMatch: whyMatch || '',
    keywordMatch: keywordMatch || null,
  });

  db.prepare(`
    INSERT INTO saved_jobs (id, user_id, job_key, title, company, location, match_score, job_url, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, job_key) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      location = excluded.location,
      match_score = excluded.match_score,
      job_url = excluded.job_url,
      payload = excluded.payload
  `).run(
    uuidv4(),
    req.user.id,
    normalized.jobKey,
    normalized.title,
    normalized.company,
    normalized.location,
    normalized.matchScore ?? null,
    normalized.jobUrl,
    payload
  );

  return res.json({ saved: true, jobKey: normalized.jobKey });
};

const removeSavedMatch = (req, res) => {
  const { jobKey } = req.params;
  db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_key = ?').run(req.user.id, jobKey);
  return res.json({ saved: false, jobKey });
};

module.exports = { findMatches, saveMatch, removeSavedMatch, uploadResume };
