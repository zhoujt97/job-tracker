const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { findMatches } = require('../controllers/jobMatchesController');

router.use(authenticate);
router.post('/find', findMatches);

module.exports = router;