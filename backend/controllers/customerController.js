const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// GET /api/customer/:customerId/profile
const getCustomerProfile = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });

    res.json({ customer, riskScore });
  } catch (err) {
    next(err);
  }
};

// GET /api/customer/:customerId/intervention-history
const getInterventionHistory = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const interventions = await Intervention.find({ customerId: customer._id })
      .sort({ timestamp: -1 })
      .populate('riskScoreId', 'patternDetected financialHealthScore');

    res.json(interventions);
  } catch (err) {
    next(err);
  }
};

// GET /api/customer/:customerId/network-risk
const getNetworkRisk = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    const networkStressScore = riskScore?.dimensionScores?.networkRisk || rand(20, 80);

    res.json({
      suppliersInDistress: rand(1, 5),
      totalSuppliers: rand(5, 10),
      customersInDistress: rand(0, 3),
      totalCustomers: rand(3, 8),
      networkStressScore,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/customer/:customerId/rescore
const rescoreCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const latest = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (!latest) {
      return res.status(404).json({ message: 'No existing risk score to rescore from' });
    }

    const variation = () => Math.round((Math.random() - 0.5) * 10);
    const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

    const newScore = clamp(latest.financialHealthScore + variation());
    let newPriority;
    if (newScore >= 80) newPriority = 'P5';
    else if (newScore >= 60) newPriority = 'P4';
    else if (newScore >= 40) newPriority = 'P3';
    else if (newScore >= 20) newPriority = 'P2';
    else newPriority = 'P1';

    const newSurvival = {};
    let base = clamp((latest.survivalProbabilities?.week1 || 0.9) + (Math.random() - 0.5) * 0.05, 0.5, 0.99);
    for (let i = 1; i <= 12; i++) {
      newSurvival[`week${i}`] = parseFloat(base.toFixed(3));
      base = clamp(base - (Math.random() * 0.04 + 0.01), 0.1, 0.99);
    }

    const newDimensions = {};
    Object.entries(latest.dimensionScores || {}).forEach(([k, v]) => {
      newDimensions[k] = clamp(v + variation());
    });

    const newRiskScore = await RiskScore.create({
      customerId: customer._id,
      asOfDate: new Date(),
      financialHealthScore: newScore,
      priorityLevel: newPriority,
      patternDetected: latest.patternDetected,
      patternConfidence: parseFloat((latest.patternConfidence + (Math.random() - 0.5) * 0.05).toFixed(2)),
      fraudScore: clamp(latest.fraudScore + variation()),
      survivalProbabilities: newSurvival,
      dimensionScores: newDimensions,
      shapSignals: latest.shapSignals,
      interventionRecommended: latest.interventionRecommended,
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * rand(1, 24)),
      status: 'PENDING',
      distressPyramidLevel: latest.distressPyramidLevel,
    });

    res.json(newRiskScore);
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomerProfile, getInterventionHistory, getNetworkRisk, rescoreCustomer };
