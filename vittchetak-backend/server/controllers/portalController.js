const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

const DIMENSION_LABELS = {
  liquidityIndex: 'Consistent Savings — 6 months buffer maintained',
  incomeStability: 'Stable Income — Regular salary credited on time',
  portfolioHealth: 'Active Investments — SIP running consistently',
};

const ATTENTION_LABELS = {
  debtBurden: 'High Credit Use — Above 70% threshold',
  behavioralSignals: 'Low Emergency Fund — Cover only 2 months',
  networkRisk: 'Supply Chain Exposure — Key buyer under stress',
};

// GET /api/portal/:customerId/health
const getHealthSummary = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const allScores = await RiskScore.find({ customerId: customer._id })
      .sort({ asOfDate: -1 })
      .limit(6);

    const latest = allScores[0];
    if (!latest) {
      return res.status(404).json({ message: 'No health score available' });
    }

    const score = latest.financialHealthScore;
    let band;
    if (score >= 80) band = 'EXCELLENT';
    else if (score >= 60) band = 'GOOD';
    else if (score >= 40) band = 'MODERATE';
    else if (score >= 20) band = 'AT_RISK';
    else band = 'CRITICAL';

    const dims = latest.dimensionScores || {};

    const strengths = Object.entries(DIMENSION_LABELS)
      .filter(([key]) => (dims[key] || 0) > 70)
      .map(([, label]) => label);

    const attentionAreas = Object.entries(ATTENTION_LABELS)
      .filter(([key]) => (dims[key] || 100) < 50)
      .map(([, label]) => label);

    const scoreTrend = allScores.map((rs) => ({
      date: rs.asOfDate,
      score: rs.financialHealthScore,
    })).reverse();

    res.json({
      score,
      band,
      summaryText: `Your financial health is ${band.toLowerCase().replace('_', ' ')}. ${strengths.length > 0 ? 'You have strong areas in ' + strengths.slice(0, 2).join(' and ') + '.' : ''}`,
      strengths: strengths.length > 0 ? strengths : ['Account in good standing'],
      attentionAreas: attentionAreas.length > 0 ? attentionAreas : ['No critical concerns at this time'],
      scoreTrend,
      name: customer.name,
      customerId: customer.customerId,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/portal/:customerId/simulate
const simulateScenario = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { incomeChange, monthlySIP, emergencyExpense, loanAmount, tenure } = req.body;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const latest = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    const currentScore = latest?.financialHealthScore || 60;

    let delta = 0;
    const explanations = [];

    if (incomeChange) {
      const impact = Math.round((incomeChange / 100) * 15);
      delta += impact;
      explanations.push(`Income ${incomeChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(incomeChange)}% → ${impact > 0 ? '+' : ''}${impact} pts`);
    }

    if (monthlySIP) {
      const impact = Math.min(8, Math.round(monthlySIP / 5000));
      delta += impact;
      explanations.push(`Monthly SIP of ₹${monthlySIP} → +${impact} pts portfolio boost`);
    }

    if (emergencyExpense) {
      const impact = -Math.min(20, Math.round(emergencyExpense / 50000));
      delta += impact;
      explanations.push(`Emergency expense of ₹${emergencyExpense} → ${impact} pts liquidity impact`);
    }

    if (loanAmount) {
      const impact = -Math.round((loanAmount / 5000000) * 6 + (tenure ? tenure / 30 * 2 : 0));
      delta += impact;
      explanations.push(`New loan of ₹${loanAmount} → ${impact} pts DTI impact`);
    }

    const projectedScore = clamp(currentScore + delta);

    res.json({
      currentScore,
      projectedScore,
      delta,
      change: delta,
      explanation: explanations.join('. ') || 'No changes simulated.',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/portal/:customerId/alert-preferences
const updateAlertPreferences = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { lowBalance, paymentReminder, scoreChange, quietHoursStart, quietHoursEnd, preferences } = req.body;

    const prefs = preferences || { lowBalance, paymentReminder, scoreChange, quietHoursStart, quietHoursEnd };

    await Customer.findOneAndUpdate(
      { customerId },
      { $set: { alertPreferences: prefs } },
      { new: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/portal/:customerId/request-counsellor
const requestCounsellor = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (!riskScore) {
      return res.status(404).json({ message: 'No risk score found' });
    }

    await Intervention.create({
      customerId: customer._id,
      riskScoreId: riskScore._id,
      interventionType: 'COUNSELLOR_REFERRAL',
      channel: 'RM_CALL',
      messagePreview: 'Customer requested counsellor via self-service portal',
      approvedBy: 'SELF_SERVICE',
      confidenceScore: 1.0,
    });

    await RiskScore.findByIdAndUpdate(riskScore._id, { priorityLevel: 'P1' });

    res.json({
      success: true,
      message: 'Counsellor will contact you within 1 hour',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHealthSummary, simulateScenario, updateAlertPreferences, requestCounsellor };
