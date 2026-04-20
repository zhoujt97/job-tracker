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
`);

const applicationColumns = db.prepare('PRAGMA table_info(applications)').all();
const hasSourceColumn = applicationColumns.some((column) => column.name === 'source');

if (!hasSourceColumn) {
  db.exec('ALTER TABLE applications ADD COLUMN source TEXT');
}

console.log('Database connected');

module.exports = db;
