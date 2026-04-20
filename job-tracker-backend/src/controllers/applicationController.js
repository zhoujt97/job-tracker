const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const ALLOWED_STATUSES = ['Planned', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Ghosted'];

const pickText = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
};

const getBody = (req) => (req.body && typeof req.body === 'object' ? req.body : {});

const normalizeSequence = (status, statusSequence) => {
  const sequence = Array.isArray(statusSequence)
    ? statusSequence.map((s) => String(s || '').trim()).filter(Boolean)
    : [];

  if (sequence.length === 0 && status) {
    sequence.push(String(status).trim());
  }

  const invalidStatus = sequence.find((s) => !ALLOWED_STATUSES.includes(s));
  if (invalidStatus) {
    return { error: `Invalid status: ${invalidStatus}` };
  }

  return { sequence };
};

const getStoredSequence = (applicationId) => {
  const rows = db.prepare(`
    SELECT to_status
    FROM application_status_events
    WHERE application_id = ?
    ORDER BY rowid ASC
  `).all(applicationId);

  return rows
    .map((row) => row.to_status)
    .filter((status, index, arr) => index === 0 || status !== arr[index - 1]);
};

const getApplications = (req, res) => {
  const { page = 1, limit = 10, search, status, sortBy = 'created_at', order = 'asc' } = req.query;
  const offset = (page - 1) * limit;

  const allowedSort = ['deadline', 'applied_date', 'company_name', 'priority', 'created_at', 'status', 'source'];
  const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const safeOrder = order === 'desc' ? 'DESC' : 'ASC';

  let query = 'SELECT * FROM applications WHERE user_id = ?';
  let countQuery = 'SELECT COUNT(*) as total FROM applications WHERE user_id = ?';
  const params = [req.user.id];

  if (search) {
    query += ' AND (company_name LIKE ? OR job_title LIKE ?)';
    countQuery += ' AND (company_name LIKE ? OR job_title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
  }

  query += ` ORDER BY ${safeSortBy} ${safeOrder} LIMIT ? OFFSET ?`;

  const applications = db.prepare(query).all(...params, parseInt(limit), parseInt(offset));
  const { total } = db.prepare(countQuery).get(...params);

  res.json({
    data: applications,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  });
};

const createApplication = (req, res) => {
  const body = getBody(req);
  const companyName = pickText(body.company_name, body.companyName, body?.application?.company_name);
  const jobTitle = pickText(body.job_title, body.jobTitle, body?.application?.job_title);
  const priority = pickText(body.priority, body?.application?.priority);
  const source = pickText(body.source, body?.application?.source);
  const jobDescription = pickText(body.job_description, body.jobDescription, body?.application?.job_description);
  const deadline = pickText(body.deadline, body?.application?.deadline);
  const appliedDate = pickText(body.applied_date, body.appliedDate, body?.application?.applied_date);
  const status = pickText(body.status, body?.application?.status);
  const statusSequence = Array.isArray(body.status_sequence) ? body.status_sequence : body?.application?.status_sequence;

  if (!companyName || !jobTitle || !priority) {
    return res.status(400).json({ error: 'company_name, job_title and priority are required', received: { companyName, jobTitle, priority } });
  }

  const normalized = normalizeSequence(status, statusSequence);
  if (normalized.error) return res.status(400).json({ error: normalized.error });
  if (normalized.sequence.length === 0) {
    return res.status(400).json({ error: 'At least one status is required' });
  }

  const finalStatus = normalized.sequence[normalized.sequence.length - 1];
  const id = uuidv4();
  const createWithInitialEvent = db.transaction(() => {
    db.prepare(`
      INSERT INTO applications (id, user_id, company_name, job_title, source, job_description, status, priority, deadline, applied_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      companyName,
      jobTitle,
      source || null,
      jobDescription || null,
      finalStatus,
      priority,
      deadline || null,
      appliedDate || null
    );

    let previousStatus = null;
    normalized.sequence.forEach((nextStatus, index) => {
      db.prepare(`
        INSERT INTO application_status_events (id, application_id, user_id, from_status, to_status, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        id,
        req.user.id,
        previousStatus,
        nextStatus,
        index === 0 ? 'Initial status' : 'Initial sequence step'
      );
      previousStatus = nextStatus;
    });
  });

  createWithInitialEvent();

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.status(201).json(application);
};

const updateApplication = (req, res) => {
  const { id } = req.params;
  const body = getBody(req);
  const companyName = pickText(body.company_name, body.companyName, body?.application?.company_name);
  const jobTitle = pickText(body.job_title, body.jobTitle, body?.application?.job_title);
  const source = pickText(body.source, body?.application?.source);
  const jobDescription = pickText(body.job_description, body.jobDescription, body?.application?.job_description);
  const status = pickText(body.status, body?.application?.status);
  const priority = pickText(body.priority, body?.application?.priority);
  const deadline = pickText(body.deadline, body?.application?.deadline);
  const appliedDate = pickText(body.applied_date, body.appliedDate, body?.application?.applied_date);
  const statusNote = pickText(body.status_note, body.statusNote, body?.application?.status_note);
  const statusSequence = Array.isArray(body.status_sequence) ? body.status_sequence : body?.application?.status_sequence;

  const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const normalized = normalizeSequence(status, statusSequence);
  if (normalized.error) return res.status(400).json({ error: normalized.error });

  const explicitSequence = Array.isArray(statusSequence) ? normalized.sequence : null;
  const nextStatus = explicitSequence && explicitSequence.length > 0
    ? explicitSequence[explicitSequence.length - 1]
    : (status || application.status);

  const updateWithOptionalEvent = db.transaction(() => {
    db.prepare(`
      UPDATE applications
      SET company_name = ?, job_title = ?, source = ?, job_description = ?, status = ?, priority = ?, deadline = ?, applied_date = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      companyName || application.company_name,
      jobTitle || application.job_title,
      source || application.source,
      jobDescription || application.job_description,
      nextStatus,
      priority || application.priority,
      deadline || application.deadline,
      appliedDate || application.applied_date,
      id,
      req.user.id
    );

    if (explicitSequence && explicitSequence.length > 0) {
      const existingSequence = getStoredSequence(id);
      const incomingSequence = explicitSequence.filter(
        (sequenceStatus, index) => index === 0 || sequenceStatus !== explicitSequence[index - 1]
      );

      let appendSequence = [];
      const existingPrefixMatches =
        incomingSequence.length >= existingSequence.length &&
        existingSequence.every((statusValue, index) => incomingSequence[index] === statusValue);

      if (existingPrefixMatches) {
        appendSequence = incomingSequence.slice(existingSequence.length);
      } else if (incomingSequence[0] === application.status) {
        appendSequence = incomingSequence.slice(1);
      }

      let previousStatus = application.status;
      appendSequence.forEach((sequenceStatus) => {
        db.prepare(`
          INSERT INTO application_status_events (id, application_id, user_id, from_status, to_status, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), id, req.user.id, previousStatus, sequenceStatus, statusNote || 'Status sequence update');
        previousStatus = sequenceStatus;
      });
    } else if (nextStatus !== application.status) {
      db.prepare(`
        INSERT INTO application_status_events (id, application_id, user_id, from_status, to_status, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, req.user.id, application.status, nextStatus, statusNote || 'Status update');
    }
  });

  updateWithOptionalEvent();

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.json(updated);
};

const deleteApplication = (req, res) => {
  const { id } = req.params;

  const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ message: 'Application deleted' });
};
const getStats = (req, res) => {
  const statuses = ['Planned', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Ghosted'];
  const statusCounts = {};

  statuses.forEach(status => {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = ?'
    ).get(req.user.id, status);
    statusCounts[status] = result.count;
  });

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM applications WHERE user_id = ?'
  ).get(req.user.id);

  res.json({ statusCounts, total: total.count });
};

const getSourceStatusFlow = (req, res) => {
  const rows = db.prepare(`
    SELECT
      COALESCE(NULLIF(TRIM(source), ''), 'Unknown') AS source,
      status,
      COUNT(*) AS value
    FROM applications
    WHERE user_id = ?
    GROUP BY COALESCE(NULLIF(TRIM(source), ''), 'Unknown'), status
    ORDER BY value DESC
  `).all(req.user.id);

  res.json({ flows: rows });
};

const getStatusTransitionFlow = (req, res) => {
  const rows = db.prepare(`
    SELECT
      COALESCE(from_status, 'Submitted') AS from_status,
      to_status,
      COUNT(*) AS value
    FROM application_status_events
    WHERE user_id = ?
    GROUP BY COALESCE(from_status, 'Submitted'), to_status
    ORDER BY value DESC
  `).all(req.user.id);

  res.json({ flows: rows });
};

const getStatusSequenceFlow = (req, res) => {
  const rows = db.prepare(`
    SELECT application_id, to_status, changed_at, id
    FROM application_status_events
    WHERE user_id = ?
    ORDER BY application_id ASC, rowid ASC
  `).all(req.user.id);

  const perApplication = new Map();
  rows.forEach((row) => {
    if (!perApplication.has(row.application_id)) {
      perApplication.set(row.application_id, []);
    }
    perApplication.get(row.application_id).push(row.to_status);
  });

  const edgeCounts = new Map();
  const addEdge = (from, to) => {
    const key = `${from}|||${to}`;
    edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
  };

  perApplication.forEach((sequence) => {
    const deduped = sequence.filter((status, idx) => idx === 0 || status !== sequence[idx - 1]);
    if (deduped.length === 0) return;

    addEdge('Applications', `Stage 1: ${deduped[0]}`);
    for (let i = 1; i < deduped.length; i += 1) {
      addEdge(`Stage ${i}: ${deduped[i - 1]}`, `Stage ${i + 1}: ${deduped[i]}`);
    }
  });

  const flows = [...edgeCounts.entries()].map(([key, value]) => {
    const [from, to] = key.split('|||');
    return { from, to, value };
  });

  res.json({ flows });
};

const getApplicationStatusSequence = (req, res) => {
  const { id } = req.params;
  const application = db.prepare('SELECT id FROM applications WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const sequence = getStoredSequence(id);
  return res.json({ status_sequence: sequence });
};

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getStats,
  getSourceStatusFlow,
  getStatusTransitionFlow,
  getStatusSequenceFlow,
  getApplicationStatusSequence,
};
