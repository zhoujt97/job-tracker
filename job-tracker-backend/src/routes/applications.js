const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');

router.use(authenticate);

router.get('/', getApplications);
router.post('/', createApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;