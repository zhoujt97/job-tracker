const DIFFICULTY_ORDER = ['Easy', 'Medium', 'Medium', 'Hard', 'Hard', 'Medium'];

const QUESTION_BLUEPRINTS = [
  {
    category: 'Behavioral',
    template: ({ jobTitle, company }) => `Tell me about a project where you made a measurable impact as a ${jobTitle} at a company like ${company}.`,
    tips: [
      'Use STAR format (Situation, Task, Action, Result).',
      'Quantify impact with clear metrics.',
      'Highlight tradeoffs you considered.',
      'Close with what you would improve next time.',
    ],
  },
  {
    category: 'Technical',
    template: ({ jobTitle }) => `Walk through how you would approach a core technical challenge in this ${jobTitle} role from requirements to delivery.`,
    tips: [
      'Clarify assumptions before giving a solution.',
      'Explain architecture or workflow step-by-step.',
      'Call out constraints and risk areas early.',
      'Discuss how you would validate the outcome.',
    ],
  },
  {
    category: 'Problem Solving',
    template: ({ company }) => `If ${company} asked you to improve a key performance metric in 90 days, how would you prioritize and execute?`,
    tips: [
      'Start by defining the target metric and baseline.',
      'Break work into hypotheses and experiments.',
      'Prioritize by impact, effort, and confidence.',
      'Show how you would report progress weekly.',
    ],
  },
  {
    category: 'Situational',
    template: ({ jobTitle }) => `How would you handle a disagreement with stakeholders about scope or priorities on a ${jobTitle} project?`,
    tips: [
      'Demonstrate active listening and alignment goals.',
      'Frame options with pros, cons, and risks.',
      'Propose a data-driven decision process.',
      'Explain how you keep execution moving.',
    ],
  },
  {
    category: 'Culture Fit',
    template: ({ company }) => `What type of team environment helps you do your best work, and how would you contribute to that culture at ${company}?`,
    tips: [
      'Give concrete examples, not abstract traits.',
      'Show collaboration style across roles.',
      'Connect your values to team outcomes.',
      'Mention how you handle feedback and growth.',
    ],
  },
  {
    category: 'User Research',
    template: ({ jobTitle }) => `How would you gather and use user feedback to improve decisions in a ${jobTitle} role?`,
    tips: [
      'Describe research methods you would choose and why.',
      'Explain how you avoid biased samples.',
      'Tie insights to product or process changes.',
      'Share how you measure post-launch impact.',
    ],
  },
];

const sanitizeText = (value, fallback) => {
  const text = (value || '').toString().trim();
  return text || fallback;
};

const generateQuestions = async (req, res) => {
  try {
    const jobTitle = sanitizeText(req.body.jobTitle, 'this role');
    const company = sanitizeText(req.body.company, 'this company');

    const questions = QUESTION_BLUEPRINTS.map((item, index) => ({
      question: item.template({ jobTitle, company }),
      difficulty: DIFFICULTY_ORDER[index] || 'Medium',
      category: item.category,
      tips: item.tips,
    }));

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

module.exports = { generateQuestions };
