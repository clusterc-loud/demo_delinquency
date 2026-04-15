const express = require('express');
const router = express.Router();
const {
  getKPIs,
  getRiskHeatmap,
  getScoreDistribution,
  getRecentFlags,
  getInterventionOutcomes,
} = require('../controllers/dashboardController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/kpis', getKPIs);
router.get('/risk-heatmap', getRiskHeatmap);
router.get('/score-distribution', getScoreDistribution);
router.get('/recent-flags', getRecentFlags);
router.get('/intervention-outcomes', getInterventionOutcomes);

module.exports = router;
