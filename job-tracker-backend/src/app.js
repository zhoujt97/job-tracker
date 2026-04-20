const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const jobMatchesRoutes = require('./routes/jobMatches');
const interviewPrepRoutes = require('./routes/interviewPrep');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/job-matches', jobMatchesRoutes);
app.use('/api/interview-prep', interviewPrepRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
