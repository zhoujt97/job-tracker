const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getStats,
  getSourceStatusFlow,
} = require('../controllers/applicationController');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/source-status-flow', getSourceStatusFlow);
router.get('/', getApplications);
router.post('/', createApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;
