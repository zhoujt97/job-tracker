const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../job_tracker.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    source TEXT,
    job_description TEXT,
    status TEXT CHECK(status IN ('Planned','Applied','Interviewing','Offered','Rejected','Ghosted')),
    priority TEXT CHECK(priority IN ('High','Medium','Low')),
    deadline TEXT,
    applied_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS saved_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    job_key TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    match_score INTEGER,
    job_url TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, job_key)
  );

  CREATE TABLE IF NOT EXISTS application_status_events (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now')),
    note TEXT
  );
`);

const applicationColumns = db.prepare('PRAGMA table_info(applications)').all();
const hasSourceColumn = applicationColumns.some((column) => column.name === 'source');

if (!hasSourceColumn) {
  db.exec('ALTER TABLE applications ADD COLUMN source TEXT');
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_status_events_user ON application_status_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_status_events_app ON application_status_events(application_id);
`);

db.exec(`
  INSERT INTO application_status_events (id, application_id, user_id, from_status, to_status, changed_at, note)
  SELECT
    lower(hex(randomblob(16))),
    a.id,
    a.user_id,
    NULL,
    a.status,
    a.created_at,
    'Backfilled initial status'
  FROM applications a
  WHERE NOT EXISTS (
    SELECT 1
    FROM application_status_events e
    WHERE e.application_id = a.id
  );
`);

console.log('Database connected');

module.exports = db;
