# Job Tracker

A web application to track job applications.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite

## Project Structure

job-tracker-backend/ — Express API server
job-tracker-frontend/ — React frontend

## Setup

### Backend

cd job-tracker-backend
npm install

Create a .env file:
PORT=3000
JWT_SECRET=your_secret_key_here

Run the server:
npm run dev

Server runs on http://localhost:3000

### Frontend

cd job-tracker-frontend
npm install
npm run dev

Frontend runs on http://localhost:5173

## Features

- Signup and login
- Add, edit, delete job applications
- Track status: Planned, Applied, Interviewing, Offered, Rejected, Ghosted
- Search, filter, sort, pagination