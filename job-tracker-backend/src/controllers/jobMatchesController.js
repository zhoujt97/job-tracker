const multer = require('multer');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_TEXT_LENGTH = 12000;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'you', 'your', 'are', 'our', 'will', 'all',
  'job', 'role', 'work', 'team', 'using', 'into', 'their', 'they', 'been', 'than', 'but', 'its', 'per',
]);

const SKILL_KEYWORDS = [
  { match: 'javascript', label: 'JavaScript' },
  { match: 'typescript', label: 'TypeScript' },
  { match: 'react', label: 'React' },
  { match: 'node', label: 'Node.js' },
  { match: 'express', label: 'Express' },
  { match: 'python', label: 'Python' },
  { match: 'java', label: 'Java' },
  { match: 'sql', label: 'SQL' },
  { match: 'postgres', label: 'PostgreSQL' },
  { match: 'mysql', label: 'MySQL' },
  { match: 'aws', label: 'AWS' },
  { match: 'docker', label: 'Docker' },
  { match: 'kubernetes', label: 'Kubernetes' },
  { match: 'git', label: 'Git' },
  { match: 'rest', label: 'REST APIs' },
  { match: 'graphql', label: 'GraphQL' },
  { match: 'figma', label: 'Figma' },
  { match: 'user research', label: 'User Research' },
  { match: 'analytics', label: 'Analytics' },
  { match: 'tableau', label: 'Tableau' },
  { match: 'excel', label: 'Excel' },
  { match: 'communication', label: 'Communication' },
  { match: 'leadership', label: 'Leadership' },
  { match: 'project management', label: 'Project Management' },
  { match: 'agile', label: 'Agile' },
];

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

const tokenize = (text = '') =>
  (text.toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter(
    (token) => token.length > 2 && !STOP_WORDS.has(token)
  );

const extractSkills = (text = '', max = 5) => {
  const lowered = text.toLowerCase();
  const skills = [];

  for (const skill of SKILL_KEYWORDS) {
    if (lowered.includes(skill.match) && !skills.includes(skill.label)) {
      skills.push(skill.label);
    }
    if (skills.length === max) break;
  }

  return skills;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
  const url = new URL('https://api.adzuna.com/v1/api/jobs/us/search/1/');

  url.searchParams.append('app_id', process.env.ADZUNA_APP_ID);
  url.searchParams.append('app_key', process.env.ADZUNA_APP_KEY);
  url.searchParams.append('what', query);
  url.searchParams.append('where', location);
  url.searchParams.append('results_per_page', 5);

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const reason = data?.error || data?.message || 'Adzuna request failed';
    throw new Error(reason);
  }

  return (data.results || []).slice(0, 5).map((job) => ({
    title: job.title,
    company: job.company?.display_name,
    location: job.location?.display_name,
    jobUrl: job.redirect_url,
    description: (job.description || '').slice(0, 800),
  }));
}

const buildMatchedJob = ({ job, resumeText, resumeTokenSet, queryTokenSet, finalLocation }) => {
  const title = job.title || '';
  const description = job.description || '';
  const jobText = `${title} ${description}`;
  const jobTokenSet = new Set(tokenize(jobText));

  const requiredSkills = extractSkills(jobText, 5);
  const resumeSkills = extractSkills(resumeText, 5);
  const matchedRequired = requiredSkills.filter((skill) => resumeText.toLowerCase().includes(skill.toLowerCase()));

  const skills = [...matchedRequired, ...resumeSkills.filter((skill) => !matchedRequired.includes(skill))].slice(0, 5);
  const fallbackSkills = skills.length > 0 ? skills : requiredSkills.slice(0, 3);

  const tokenOverlap = [...jobTokenSet].filter((token) => resumeTokenSet.has(token));
  const keywordTotal = clamp(jobTokenSet.size || 8, 8, 15);
  const keywordMatched = clamp(tokenOverlap.length, 0, keywordTotal);

  const keywordRatio = keywordMatched / keywordTotal;
  const requiredRatio = requiredSkills.length
    ? matchedRequired.length / requiredSkills.length
    : keywordRatio;

  const titleLower = title.toLowerCase();
  const hasQueryHit = [...queryTokenSet].some((token) => titleLower.includes(token));
  const hasLocationHit = finalLocation && (job.location || '').toLowerCase().includes(finalLocation.toLowerCase());

  const scoreBase = 70 + Math.round(keywordRatio * 16) + Math.round(requiredRatio * 8);
  const scoreBoost = (hasQueryHit ? 2 : 0) + (hasLocationHit ? 1 : 0);
  const matchScore = clamp(scoreBase + scoreBoost, 70, 97);

  const whyMatch = `This role aligns with your background in ${fallbackSkills.slice(0, 2).join(' and ') || 'relevant skills'} and matches ${keywordMatched} of ${keywordTotal} key terms from your resume.`;

  return {
    ...job,
    matchScore,
    skills: fallbackSkills,
    requiredSkills: requiredSkills.length ? requiredSkills : fallbackSkills,
    whyMatch,
    keywordMatch: {
      matched: keywordMatched,
      total: keywordTotal,
    },
  };
};

const findMatches = async (req, res) => {
  try {
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      return res.status(503).json({ error: 'ADZUNA_APP_ID and ADZUNA_APP_KEY must be set' });
    }

    const { jobType, location } = req.body;
    const pastedResumeText = (req.body.resumeText || '').trim();
    const uploadedResumeText = await extractResumeText(req.file);
    const combinedResumeText = [pastedResumeText, uploadedResumeText].filter(Boolean).join('\n\n');
    const resumeText = combinedResumeText.slice(0, MAX_RESUME_TEXT_LENGTH);

    const finalQuery = (jobType || '').trim() || 'software engineer';
    const finalLocation = (location || '').trim() || 'United States';

    const adzunaJobs = await fetchAdzunaJobs({
      query: finalQuery,
      location: finalLocation,
    });

    const resumeTokenSet = new Set(tokenize(resumeText));
    const queryTokenSet = new Set(tokenize(finalQuery));

    const matchedJobs = adzunaJobs.map((job) =>
      buildMatchedJob({
        job,
        resumeText,
        resumeTokenSet,
        queryTokenSet,
        finalLocation,
      })
    );

    const savedKeys = getSavedKeySet(req.user.id);
    const jobs = matchedJobs.map((job) => {
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
