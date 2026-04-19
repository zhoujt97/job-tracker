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
- company (string)
- location (string)
- matchScore (number 0-100)
- skills (array of 3-5 strings)
- whyMatch (string, one sentence)
- requiredSkills (array of 3-5 strings)
- keywordMatch (object with matched and total numbers)

Only return the JSON array, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
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