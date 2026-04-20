const OpenAI = require('openai');

const generateQuestions = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { jobTitle, company } = req.body;

    const prompt = `You are an interview coach. Generate 6 realistic interview questions for a ${jobTitle} position at ${company}.

For each question return:
- question (string): the interview question
- difficulty (string): one of "Easy", "Medium", "Hard"
- category (string): one of "Behavioral", "Technical", "Situational", "Culture Fit", "User Research", "Problem Solving"
- tips (array of 4 strings): specific preparation tips for answering this question

Return only a JSON array of 6 questions, no markdown, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const questions = JSON.parse(content);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

module.exports = { generateQuestions };
