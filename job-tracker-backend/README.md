# Job Tracker Backend

Express API for the Job Tracker app with SQLite storage.

## Requirements

- Node.js `24.x` (recommended)
- npm `11.x` (comes with Node 24)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in this folder:

```env
PORT=3000
JWT_SECRET=replace_with_a_long_random_secret
# Optional: required only for AI routes
# OPENAI_API_KEY=your_openai_api_key
```

3. Start in development mode:

```bash
npm run dev
```

Server URL: `http://localhost:3000`

## Environment Troubleshooting

### 1) `Server running on port undefined`
- Cause: `PORT` is missing from `.env`.
- Fix: add `PORT=3000` to `.env` and restart.

### 2) `Missing credentials ... OPENAI_API_KEY`
- Cause: AI endpoints were called without `OPENAI_API_KEY`.
- Behavior: server still runs; only AI routes fail.
- Fix: add `OPENAI_API_KEY` to `.env` if using:
  - `POST /api/job-matches`
  - `POST /api/interview-prep`

### 3) `better-sqlite3` / `NODE_MODULE_VERSION` mismatch
- Cause: dependencies were built with a different Node version.
- Fix:

```bash
rm -rf node_modules
npm install
```

If you have multiple Node installs, force one version (for example with `nvm`):

```bash
nvm use 24
node -v
```

### 4) App starts but frontend cannot reach backend
- Confirm backend is running on port `3000`.
- Frontend API base URL is `http://localhost:3000/api`.

