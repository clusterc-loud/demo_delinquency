const express = require('express');
const router = express.Router();
const {
  getHealthSummary,
  simulateScenario,
  updateAlertPreferences,
  requestCounsellor,
} = require('../controllers/portalController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/:customerId/health', getHealthSummary);
router.post('/:customerId/simulate', simulateScenario);
router.patch('/:customerId/alert-preferences', updateAlertPreferences);
router.post('/:customerId/request-counsellor', requestCounsellor);

module.exports = router;
