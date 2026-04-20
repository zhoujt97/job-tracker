const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { findMatches, uploadResume } = require('../controllers/jobMatchesController');

router.use(authenticate);
router.post('/find', uploadResume, findMatches);

module.exports = router;
