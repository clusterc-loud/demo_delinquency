const express = require('express');
const router = express.Router();
const { getFraudCases, getFraudEvidence, recordDecision } = require('../controllers/fraudController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getFraudCases);
router.get('/:customerId/evidence', getFraudEvidence);
router.patch('/:customerId/decision', recordDecision);

module.exports = router;
