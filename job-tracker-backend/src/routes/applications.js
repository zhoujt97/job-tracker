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
  getStatusTransitionFlow,
  getStatusSequenceFlow,
  getApplicationStatusSequence,
} = require('../controllers/applicationController');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/source-status-flow', getSourceStatusFlow);
router.get('/status-transition-flow', getStatusTransitionFlow);
router.get('/status-sequence-flow', getStatusSequenceFlow);
router.get('/:id/status-sequence', getApplicationStatusSequence);
router.get('/', getApplications);
router.post('/', createApplication);
router.patch('/:id', updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;
