const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const getApplications = (req, res) => {
  const { page = 1, limit = 10, search, status, sortBy = 'created_at', order = 'asc' } = req.query;
  const offset = (page - 1) * limit;

  const allowedSort = ['deadline', 'applied_date', 'company_name', 'priority', 'created_at', 'status'];
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
  const { company_name, job_title, job_description, status, priority, deadline, applied_date } = req.body;

  if (!company_name || !job_title || !status || !priority) {
    return res.status(400).json({ error: 'company_name, job_title, status and priority are required' });
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO applications (id, user_id, company_name, job_title, job_description, status, priority, deadline, applied_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, company_name, job_title, job_description, status, priority, deadline, applied_date);

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.status(201).json(application);
};

const updateApplication = (req, res) => {
  const { id } = req.params;
  const { company_name, job_title, job_description, status, priority, deadline, applied_date } = req.body;

  const application = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  db.prepare(`
    UPDATE applications
    SET company_name = ?, job_title = ?, job_description = ?, status = ?, priority = ?, deadline = ?, applied_date = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    company_name ?? application.company_name,
    job_title ?? application.job_title,
    job_description ?? application.job_description,
    status ?? application.status,
    priority ?? application.priority,
    deadline ?? application.deadline,
    applied_date ?? application.applied_date,
    id,
    req.user.id
  );

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

module.exports = { getApplications, createApplication, updateApplication, deleteApplication };