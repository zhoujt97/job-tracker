const OpenAI = require('openai');
const multer = require('multer');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

const findMatches = async (req, res) => {
  try {
    const { jobType, location, experienceLevel } = req.body;
    const resumeText = req.body.resumeText || '';

    const prompt = `You are a job matching assistant. Based on the following resume and preferences, generate 5 realistic job matches.

Resume:
${resumeText || 'No resume provided'}

Preferences:
- Job Type: ${jobType || 'Any'}
- Location: ${location || 'Any'}
- Experience Level: ${experienceLevel || 'Any'}

Return a JSON array of 5 job matches. Each job should have:
- title (string)
- company (string): use real well-known company names
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
    res.status(500).json({ error: 'Failed to find matches' });
  }
};

module.exports = { findMatches, upload };