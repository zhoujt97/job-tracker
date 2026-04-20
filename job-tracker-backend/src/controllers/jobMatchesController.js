const OpenAI = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');

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

    const prompt = `You are a job matching assistant. Based on the following resume and preferences, generate 5 realistic job matches.

Resume:
${resumeText || 'No resume provided'}

Preferences:
- Job Type: ${jobType || 'Any'}
- Location: ${location || 'Any'}
- Experience Level: ${experienceLevel || 'Any'}

Return a JSON array of 5 job matches. Each job should have:
- title (string)
- company (string): MUST use real well-known tech companies only, such as Google, Microsoft, Apple, Meta, Amazon, Netflix, Spotify, Airbnb, Uber, Stripe, Figma, Notion, Slack, Twitter, LinkedIn, Adobe, Salesforce, Oracle, IBM, Intel
- location (string)
- matchScore (number 0-100): vary between 70-97, do not make them all the same
- skills (array of 3-5 strings): short skill names
- whyMatch (string): one specific sentence explaining why this is a good match
- requiredSkills (array of 3-5 strings): short skill names
- keywordMatch (object): 
    - total must be between 8 and 15
    - matched must be LESS than total (realistic, not 100%)
    - example: { "matched": 7, "total": 10 } or { "matched": 5, "total": 12 }
    - never make matched equal to total

Only return the JSON array, no other text, no markdown.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    const jobs = JSON.parse(content);
    res.json({ jobs });
  } catch (err) {
    console.error(err);
    if (err.message === 'Could not extract readable text from uploaded PDF') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to find matches' });
  }
};

module.exports = { findMatches, uploadResume };
