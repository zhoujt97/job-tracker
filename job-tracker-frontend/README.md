# Job Tracker Frontend

React + Vite client for the Job Tracker app.

## Requirements

- Node.js `24.x` (recommended)
- npm `11.x` (comes with Node 24)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Backend Dependency

This frontend calls:

- `http://localhost:3000/api`

So backend must be running at port `3000` before login, signup, or data actions work.

## Environment Troubleshooting

### 1) Frontend loads but API calls fail
- Cause: backend is not running or not on port `3000`.
- Fix: start backend and verify `http://localhost:3000`.

### 2) CORS or network errors in browser console
- Cause: frontend and backend ports do not match expected values.
- Fix:
  - frontend on `5173`
  - backend on `3000`
  - keep `src/services/api.js` base URL as `http://localhost:3000/api`

### 3) `npm run dev` fails after switching machines/branches
- Cause: stale `node_modules` built in different OS/Node version.
- Fix:

```bash
rm -rf node_modules
npm install
```
