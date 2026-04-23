const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'you', 'your', 'are', 'our', 'will', 'all',
  'job', 'role', 'work', 'team', 'using', 'into', 'their', 'they', 'been', 'than', 'but', 'its', 'per',
  'how', 'what', 'when', 'where', 'who', 'why', 'about', 'would', 'could', 'should', 'them', 'then',
]);

const QUESTION_BANK = [
  {
    category: 'Behavioral',
    difficulty: 'Easy',
    keywords: ['impact', 'results', 'ownership', 'delivery'],
    template: ({ jobTitle, company }) => `Tell me about a project where you made measurable impact as a ${jobTitle} at a company like ${company}.`,
    tips: [
      'Use STAR format and keep the story focused.',
      'Quantify outcomes with concrete metrics.',
      'Explain your specific decisions and ownership.',
      'End with what you learned and improved.',
    ],
  },
  {
    category: 'Behavioral',
    difficulty: 'Medium',
    keywords: ['leadership', 'stakeholders', 'alignment', 'communication'],
    template: ({ jobTitle }) => `Describe a time you had to align multiple stakeholders with conflicting goals on a ${jobTitle} project.`,
    tips: [
      'Name each stakeholder and their goal.',
      'Show how you built alignment with data.',
      'Explain tradeoffs transparently.',
      'Highlight the final business outcome.',
    ],
  },
  {
    category: 'Behavioral',
    difficulty: 'Medium',
    keywords: ['feedback', 'growth', 'coaching', 'collaboration'],
    template: () => 'Tell me about critical feedback you received and how you applied it in later projects.',
    tips: [
      'Share the original gap clearly.',
      'Avoid defensiveness in your story.',
      'Show specific behavior changes afterward.',
      'Tie the change to stronger results.',
    ],
  },
  {
    category: 'Behavioral',
    difficulty: 'Hard',
    keywords: ['ambiguity', 'ownership', 'strategy', 'prioritization'],
    template: ({ company }) => `Give an example of succeeding in a highly ambiguous problem space similar to what ${company} might face.`,
    tips: [
      'Define what made the problem ambiguous.',
      'Describe your framework for structuring uncertainty.',
      'Explain how you set milestones and checkpoints.',
      'Show measurable outcomes and lessons learned.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['architecture', 'scalability', 'performance', 'reliability'],
    template: ({ jobTitle }) => `Walk through the architecture you would propose for a high-scale core feature in this ${jobTitle} role.`,
    tips: [
      'State assumptions and non-functional requirements first.',
      'Break the system into clear components.',
      'Discuss bottlenecks and failure modes.',
      'Include monitoring and rollback strategy.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Hard',
    keywords: ['debugging', 'incident', 'root cause', 'reliability'],
    template: () => 'Describe a severe production incident you investigated. How did you find root cause and prevent recurrence?',
    tips: [
      'Outline your debugging sequence clearly.',
      'Differentiate symptoms from root causes.',
      'Explain immediate mitigation and long-term fixes.',
      'Mention alerts and runbook improvements.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['testing', 'quality', 'automation', 'regression'],
    template: () => 'How do you design a testing strategy that balances speed, confidence, and maintainability?',
    tips: [
      'Cover unit, integration, and end-to-end layers.',
      'Call out what should be mocked versus real.',
      'Describe regression prevention for critical paths.',
      'Discuss CI gates and release criteria.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['api', 'contracts', 'versioning', 'integration'],
    template: ({ company }) => `How would you design and evolve API contracts for cross-team integrations at ${company}?`,
    tips: [
      'Describe clear contract ownership.',
      'Explain compatibility and versioning policy.',
      'Include schema validation and observability.',
      'Show communication process with consumers.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['database', 'sql', 'indexing', 'query'],
    template: () => 'A critical query is slow after growth in data volume. How would you diagnose and fix it?',
    tips: [
      'Start with query plan analysis.',
      'Discuss indexing and schema tradeoffs.',
      'Consider caching and pagination options.',
      'Verify impact with before/after metrics.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['frontend', 'react', 'state management', 'performance'],
    template: () => 'How do you keep a complex frontend responsive as feature scope grows?',
    tips: [
      'Discuss state boundaries and data flow.',
      'Mention memoization and rendering optimization.',
      'Explain code splitting and bundle strategy.',
      'Use profiling data to guide decisions.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['security', 'authentication', 'authorization', 'tokens'],
    template: ({ jobTitle }) => `What security risks are highest priority for a ${jobTitle} building customer-facing workflows?`,
    tips: [
      'Identify likely attack surfaces first.',
      'Differentiate authentication and authorization risks.',
      'Describe secure defaults and validation.',
      'Include monitoring and incident response steps.',
    ],
  },
  {
    category: 'Problem Solving',
    difficulty: 'Medium',
    keywords: ['metrics', 'kpi', 'experiments', 'optimization'],
    template: ({ company }) => `If ${company} asked you to improve a key KPI in 90 days, how would you prioritize work?`,
    tips: [
      'Start with baseline and target definitions.',
      'Break work into hypotheses and experiments.',
      'Prioritize by impact, effort, and confidence.',
      'Explain weekly progress reporting cadence.',
    ],
  },
  {
    category: 'Problem Solving',
    difficulty: 'Hard',
    keywords: ['tradeoffs', 'constraints', 'decision making', 'risk'],
    template: () => 'Describe a decision where all options had meaningful downsides. How did you choose?',
    tips: [
      'List options and explicit constraints.',
      'Show your evaluation framework.',
      'Include risk mitigation for the chosen path.',
      'Reflect on results and what you would change.',
    ],
  },
  {
    category: 'Problem Solving',
    difficulty: 'Medium',
    keywords: ['prioritization', 'roadmap', 'backlog', 'impact'],
    template: ({ jobTitle }) => `How would you prioritize a crowded roadmap in this ${jobTitle} role when everything feels urgent?`,
    tips: [
      'Define prioritization criteria up front.',
      'Use customer and business impact signals.',
      'Explain sequencing and dependency handling.',
      'Show how you communicate tradeoffs.',
    ],
  },
  {
    category: 'Problem Solving',
    difficulty: 'Medium',
    keywords: ['data', 'analytics', 'insights', 'hypothesis'],
    template: () => 'Tell me about a time data contradicted your initial intuition. What did you do next?',
    tips: [
      'Be specific about your original hypothesis.',
      'Explain the data quality checks you ran.',
      'Describe the decision you changed.',
      'Share resulting outcomes.',
    ],
  },
  {
    category: 'Problem Solving',
    difficulty: 'Hard',
    keywords: ['failure', 'postmortem', 'learning', 'process'],
    template: () => 'Walk through a failed initiative and the process changes you implemented afterward.',
    tips: [
      'Own the failure without blame shifting.',
      'Distinguish execution gaps from strategy gaps.',
      'Describe concrete process improvements.',
      'Show measurable improvement after changes.',
    ],
  },
  {
    category: 'Situational',
    difficulty: 'Medium',
    keywords: ['conflict', 'stakeholders', 'scope', 'alignment'],
    template: ({ jobTitle }) => `How would you handle disagreement about scope and priorities on a ${jobTitle} project?`,
    tips: [
      'Acknowledge each side\'s constraints.',
      'Use a shared success definition.',
      'Frame options with pros/cons.',
      'Document decisions and next actions.',
    ],
  },
  {
    category: 'Situational',
    difficulty: 'Medium',
    keywords: ['deadline', 'quality', 'risk', 'delivery'],
    template: () => 'A high-priority deadline is at risk. How do you recover without sacrificing critical quality?',
    tips: [
      'Identify the true critical path quickly.',
      'Cut non-essential scope deliberately.',
      'Escalate risks early with options.',
      'Define quality floor and release criteria.',
    ],
  },
  {
    category: 'Situational',
    difficulty: 'Medium',
    keywords: ['cross-functional', 'communication', 'dependencies', 'coordination'],
    template: ({ company }) => `You depend on multiple teams at ${company}. How do you keep cross-functional delivery on track?`,
    tips: [
      'Clarify owners and dependency dates.',
      'Use visible tracking and status updates.',
      'Address blockers with clear escalation paths.',
      'Build trust through predictable follow-through.',
    ],
  },
  {
    category: 'Situational',
    difficulty: 'Hard',
    keywords: ['customer', 'incident', 'escalation', 'communication'],
    template: () => 'How would you communicate during a customer-facing outage while the technical team investigates?',
    tips: [
      'Share known facts and unknowns separately.',
      'Provide realistic timing expectations.',
      'Coordinate updates at a predictable cadence.',
      'Follow up with a clear post-incident summary.',
    ],
  },
  {
    category: 'Situational',
    difficulty: 'Medium',
    keywords: ['onboarding', 'documentation', 'knowledge sharing', 'ramp-up'],
    template: () => 'If you joined tomorrow, how would you ramp up quickly and start delivering value in your first month?',
    tips: [
      'Prioritize domain and system understanding.',
      'Identify quick-win opportunities.',
      'Build relationships with key partners.',
      'Set measurable 30-day outcomes.',
    ],
  },
  {
    category: 'Culture Fit',
    difficulty: 'Easy',
    keywords: ['collaboration', 'culture', 'values', 'teamwork'],
    template: ({ company }) => `What kind of team culture helps you do your best work, and how would you contribute that at ${company}?`,
    tips: [
      'Give real examples, not vague values.',
      'Show how you support teammates.',
      'Describe your feedback style.',
      'Connect culture to business outcomes.',
    ],
  },
  {
    category: 'Culture Fit',
    difficulty: 'Medium',
    keywords: ['mentorship', 'growth', 'learning', 'feedback'],
    template: () => 'How do you mentor teammates while still maintaining your own execution velocity?',
    tips: [
      'Describe practical mentoring habits.',
      'Show how you set boundaries and priorities.',
      'Explain how mentorship scales team output.',
      'Give one concrete mentoring success story.',
    ],
  },
  {
    category: 'Culture Fit',
    difficulty: 'Medium',
    keywords: ['remote', 'communication', 'ownership', 'accountability'],
    template: () => 'How do you keep communication clear and ownership explicit in hybrid or remote teams?',
    tips: [
      'Mention written communication norms.',
      'Show meeting and async balance.',
      'Explain decision documentation habits.',
      'Describe follow-up and accountability mechanisms.',
    ],
  },
  {
    category: 'Culture Fit',
    difficulty: 'Medium',
    keywords: ['ethics', 'integrity', 'trust', 'decision making'],
    template: () => 'Describe a time you raised a difficult concern because it was the right thing to do.',
    tips: [
      'Frame why the concern mattered.',
      'Explain how you raised it constructively.',
      'Show how you protected team trust.',
      'Share the ultimate outcome.',
    ],
  },
  {
    category: 'Culture Fit',
    difficulty: 'Hard',
    keywords: ['influence', 'leadership', 'without authority', 'alignment'],
    template: () => 'How do you drive change when you do not have formal authority over the people involved?',
    tips: [
      'Lead with shared goals and incentives.',
      'Use evidence and clear narratives.',
      'Build coalitions, not one-off asks.',
      'Track adoption and outcomes.',
    ],
  },
  {
    category: 'User Research',
    difficulty: 'Medium',
    keywords: ['user research', 'interviews', 'insights', 'feedback'],
    template: ({ jobTitle }) => `How would you gather and apply user feedback to improve decisions in a ${jobTitle} role?`,
    tips: [
      'Choose methods based on the decision at hand.',
      'Avoid biased sampling and leading questions.',
      'Translate findings into prioritized actions.',
      'Measure outcomes after changes launch.',
    ],
  },
  {
    category: 'User Research',
    difficulty: 'Medium',
    keywords: ['experimentation', 'ab testing', 'metrics', 'validation'],
    template: () => 'How do you decide when to run experiments versus when to rely on qualitative research?',
    tips: [
      'Tie method choice to uncertainty type.',
      'Define success metrics and guardrails.',
      'Discuss sample size and confidence tradeoffs.',
      'Explain how you combine quant and qual signals.',
    ],
  },
  {
    category: 'User Research',
    difficulty: 'Hard',
    keywords: ['persona', 'segmentation', 'prioritization', 'strategy'],
    template: ({ company }) => `If ${company} serves multiple user segments, how would you prioritize which segment to optimize for first?`,
    tips: [
      'Define segment value and strategic fit.',
      'Use data to estimate opportunity size.',
      'Explain segment-specific pain points.',
      'Show a phased plan for broader coverage.',
    ],
  },
  {
    category: 'User Research',
    difficulty: 'Medium',
    keywords: ['usability', 'journey', 'friction', 'conversion'],
    template: () => 'What process do you use to identify and remove friction in a user journey?',
    tips: [
      'Map journey stages and drop-off points.',
      'Combine analytics with direct user input.',
      'Prioritize high-frequency, high-impact friction.',
      'Validate improvements with measurable results.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Hard',
    keywords: ['cloud', 'aws', 'infrastructure', 'cost'],
    template: () => 'How would you design cloud infrastructure that balances reliability, security, and cost efficiency?',
    tips: [
      'Outline architecture and failure boundaries.',
      'Address security controls by default.',
      'Discuss auto-scaling and cost monitoring.',
      'Include disaster recovery strategy.',
    ],
  },
  {
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['data pipeline', 'etl', 'quality', 'monitoring'],
    template: () => 'How do you ensure data pipeline quality as schema changes and new sources are added?',
    tips: [
      'Define schema contracts and ownership.',
      'Use automated validation at ingestion.',
      'Add freshness and anomaly monitoring.',
      'Plan backward-compatible migration steps.',
    ],
  },
  {
    category: 'Problem Solving',
    difficulty: 'Medium',
    keywords: ['customer value', 'feature prioritization', 'roadmap', 'roi'],
    template: ({ jobTitle }) => `In this ${jobTitle} role, how would you decide whether to build a requested feature or solve the underlying problem another way?`,
    tips: [
      'Clarify the user problem before solutions.',
      'Evaluate alternatives with expected impact.',
      'Quantify effort and maintenance costs.',
      'Explain your recommendation with evidence.',
    ],
  },
  {
    category: 'Situational',
    difficulty: 'Hard',
    keywords: ['senior leadership', 'communication', 'risk', 'decision'],
    template: () => 'How would you present a high-risk recommendation to senior leadership when data is incomplete?',
    tips: [
      'State knowns, unknowns, and assumptions clearly.',
      'Show scenario-based outcomes.',
      'Recommend a path with risk controls.',
      'Define what data would validate or change the plan.',
    ],
  },
];

const sanitizeText = (value, fallback) => {
  const text = (value || '').toString().trim();
  return text || fallback;
};

const tokenize = (text = '') =>
  (text.toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter(
    (token) => token.length > 2 && !STOP_WORDS.has(token)
  );

const scoreQuestion = (question, contextLower, contextTokenSet) =>
  question.keywords.reduce((score, keyword) => {
    const normalized = keyword.toLowerCase().trim();
    if (!normalized) return score;

    if (normalized.includes(' ')) {
      return contextLower.includes(normalized) ? score + 3 : score;
    }

    return contextTokenSet.has(normalized) ? score + 2 : score;
  }, 0);

const pickWeighted = (items, weightFn) => {
  const totalWeight = items.reduce((sum, item) => sum + weightFn(item), 0);
  if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];

  let cursor = Math.random() * totalWeight;
  for (const item of items) {
    cursor -= weightFn(item);
    if (cursor <= 0) return item;
  }

  return items[items.length - 1];
};

const selectQuestions = (scoredQuestions, desiredCount) => {
  const ranked = [...scoredQuestions].sort((a, b) => b.relevance - a.relevance);
  const topPool = ranked.slice(0, Math.min(14, ranked.length));

  const selected = [];
  const remaining = [...topPool];

  while (selected.length < desiredCount && remaining.length > 0) {
    const next = pickWeighted(remaining, (item) => item.relevance + 1);
    selected.push(next);
    const index = remaining.indexOf(next);
    remaining.splice(index, 1);
  }

  if (selected.length < desiredCount) {
    for (const item of ranked) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length === desiredCount) break;
    }
  }

  return selected.sort(() => Math.random() - 0.5);
};

const generateQuestions = async (req, res) => {
  try {
    const jobTitle = sanitizeText(req.body.jobTitle, 'this role');
    const company = sanitizeText(req.body.company, 'this company');
    const jobDescription = sanitizeText(req.body.jobDescription, '');

    const context = `${jobTitle} ${company} ${jobDescription}`;
    const contextLower = context.toLowerCase();
    const contextTokenSet = new Set(tokenize(context));

    const generated = QUESTION_BANK.map((item) => ({
      question: item.template({ jobTitle, company, jobDescription }),
      difficulty: item.difficulty,
      category: item.category,
      tips: item.tips,
      relevance: scoreQuestion(item, contextLower, contextTokenSet),
    }));

    const count = 5 + Math.floor(Math.random() * 2);
    const questions = selectQuestions(generated, count).map(({ relevance, ...rest }) => rest);

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
};

module.exports = { generateQuestions };
