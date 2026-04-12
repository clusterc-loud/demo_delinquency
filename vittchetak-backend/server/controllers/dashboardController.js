const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const Customer = require('../models/Customer');

// GET /api/dashboard/kpis
const getKPIs = async (req, res, next) => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalFlagged, p1Critical, interventionsPending, totalInterventions30d, recovered30d] =
      await Promise.all([
        RiskScore.countDocuments({ status: 'PENDING' }),
        RiskScore.countDocuments({ status: 'PENDING', priorityLevel: 'P1' }),
        Intervention.countDocuments({ customerResponse: 'PENDING' }),
        Intervention.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
        Intervention.countDocuments({ timestamp: { $gte: thirtyDaysAgo }, outcome30d: 'RECOVERED' }),
      ]);

    const recoveryRate30d =
      totalInterventions30d > 0 ? Math.round((recovered30d / totalInterventions30d) * 100) : 0;

    // Simulated yesterday deltas
    const deltas = {
      totalFlagged: `+${Math.floor(Math.random() * 40 + 5)}`,
      p1Critical: `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 8 + 1)}`,
      interventionsPending: `+${Math.floor(Math.random() * 15 + 2)}`,
      recoveryRate30d: `+${(Math.random() * 3).toFixed(1)}%`,
    };

    res.json({
      totalFlagged,
      p1Critical,
      interventionsPending,
      recoveryRate30d,
      deltas,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/risk-heatmap
const getRiskHeatmap = async (req, res, next) => {
  try {
    const allScores = await RiskScore.find({ status: 'PENDING' }).populate('customerId', 'customerType');

    const productMap = {
      RETAIL: 'RETAIL_PERSONAL',
      MSME: 'MSME_CREDIT',
    };

    const buckets = {};
    const productTypes = ['AGRI_LOANS', 'MSME_CREDIT', 'RETAIL_PERSONAL', 'COMMERCIAL'];

    productTypes.forEach((p) => {
      buckets[p] = { healthy: 0, watch: 0, highRisk: 0, critical: 0 };
    });

    // Seed static rows for AGRI and COMMERCIAL since we don't have those customer types
    buckets['AGRI_LOANS'] = {
      healthy: Math.floor(Math.random() * 50 + 20),
      watch: Math.floor(Math.random() * 30 + 10),
      highRisk: Math.floor(Math.random() * 20 + 5),
      critical: Math.floor(Math.random() * 10 + 2),
    };
    buckets['COMMERCIAL'] = {
      healthy: Math.floor(Math.random() * 40 + 15),
      watch: Math.floor(Math.random() * 25 + 8),
      highRisk: Math.floor(Math.random() * 15 + 4),
      critical: Math.floor(Math.random() * 8 + 1),
    };

    allScores.forEach((rs) => {
      if (!rs.customerId) return;
      const productType = productMap[rs.customerId.customerType] || 'RETAIL_PERSONAL';
      const score = rs.financialHealthScore;

      if (score >= 75) buckets[productType].healthy += 1;
      else if (score >= 50) buckets[productType].watch += 1;
      else if (score >= 25) buckets[productType].highRisk += 1;
      else buckets[productType].critical += 1;
    });

    const result = productTypes.map((pt) => ({ productType: pt, ...buckets[pt] }));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/score-distribution
const getScoreDistribution = async (req, res, next) => {
  try {
    const latestScores = await RiskScore.find({}).sort({ asOfDate: -1 });

    const bands = Array.from({ length: 10 }, (_, i) => ({
      scoreBand: `${i * 10 + 1}-${(i + 1) * 10}`,
      count: 0,
    }));
    bands[0].scoreBand = '0-10';

    // Deduplicate to one per customer
    const seen = new Set();
    latestScores.forEach((rs) => {
      const key = rs.customerId.toString();
      if (seen.has(key)) return;
      seen.add(key);

      const bandIndex = Math.min(Math.floor(rs.financialHealthScore / 10), 9);
      bands[bandIndex].count += 1;
    });

    res.json(bands);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/recent-flags
const getRecentFlags = async (req, res, next) => {
  try {
    const flags = await RiskScore.find({ status: 'PENDING' })
      .sort({ asOfDate: -1 })
      .limit(10)
      .populate('customerId', 'name customerId customerType wealthSegment');

    const result = flags.map((rs) => ({
      customerId: rs.customerId?.customerId,
      name: rs.customerId?.name,
      customerType: rs.customerId?.customerType,
      wealthSegment: rs.customerId?.wealthSegment,
      financialHealthScore: rs.financialHealthScore,
      priorityLevel: rs.priorityLevel,
      patternDetected: rs.patternDetected,
      fraudScore: rs.fraudScore,
      asOfDate: rs.asOfDate,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/intervention-outcomes
const getInterventionOutcomes = async (req, res, next) => {
  try {
    const interventions = await Intervention.find({}).populate({
      path: 'riskScoreId',
      select: 'patternDetected',
    });

    const patternMap = {};
    interventions.forEach((intv) => {
      const pattern = intv.riskScoreId?.patternDetected || 'UNKNOWN';
      if (!patternMap[pattern]) {
        patternMap[pattern] = { pattern, accepted: 0, declined: 0, noResponse: 0 };
      }
      if (intv.customerResponse === 'ACCEPTED') patternMap[pattern].accepted += 1;
      else if (intv.customerResponse === 'DECLINED') patternMap[pattern].declined += 1;
      else patternMap[pattern].noResponse += 1;
    });

    res.json(Object.values(patternMap));
  } catch (err) {
    next(err);
  }
};

module.exports = { getKPIs, getRiskHeatmap, getScoreDistribution, getRecentFlags, getInterventionOutcomes };
