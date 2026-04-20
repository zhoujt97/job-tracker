const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { findMatches, saveMatch, removeSavedMatch, uploadResume } = require('../controllers/jobMatchesController');

router.use(authenticate);
router.post('/find', uploadResume, findMatches);
router.post('/save', saveMatch);
router.delete('/save/:jobKey', removeSavedMatch);

module.exports = router;
