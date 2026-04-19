const express = require('express');
const router = express.Router();
const { generateQuestions } = require('../controllers/interviewPrepController');
const auth = require('../middleware/auth');

router.post('/generate', auth, generateQuestions);

module.exports = router;