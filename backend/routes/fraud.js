const express = require('express');
const router = express.Router();
const { getFraudStats, getFraudCases, getFraudEvidence, recordDecision } = require('../controllers/fraudController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/stats', getFraudStats);
router.get('/', getFraudCases);
router.get('/:customerId/evidence', getFraudEvidence);
router.patch('/:customerId/decision', recordDecision);

module.exports = router;
