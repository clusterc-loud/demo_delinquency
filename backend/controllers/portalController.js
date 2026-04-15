const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const mlClient = require('../utils/mlClient');
const { recordRiskTransactionOnChain } = require('../services/blockchainService');

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
      customerType: customer.customerType,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber,
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
    let projectedScore = currentScore;
    let explanations = [];

    try {
      if (customer.customerType === 'MSME') {
        let msmeData = { ...(customer.mlFeatures?.msme || { loan_amount: 100000, annual_income: 500000, dti: 0.3, revol_util: 0.3, int_rate: 0.12, term: 36, no_emp: 5 }) };
        
        if (incomeChange) {
          msmeData.annual_income += (msmeData.annual_income * (incomeChange / 100));
          explanations.push(`Income ${incomeChange > 0 ? 'increase' : 'decrease'} evaluated dynamically`);
        }
        if (loanAmount) {
          msmeData.loan_amount += loanAmount;
          explanations.push(`New loan evaluated for DTI and leverage impacts`);
        }
        
        const mlRes = await mlClient.predictMSME(msmeData);
        projectedScore = mlRes.vitt_chetak_index;
      } else {
        let retailData = { ...(customer.mlFeatures?.retail || { AMT_INCOME_TOTAL: 50000, AMT_CREDIT: 100000 }) };
        
        if (incomeChange) {
          retailData.AMT_INCOME_TOTAL += (retailData.AMT_INCOME_TOTAL * (incomeChange / 100));
          explanations.push(`Income change evaluated dynamically`);
        }
        if (loanAmount) {
          retailData.AMT_CREDIT += loanAmount;
          explanations.push(`New loan evaluated for debt burden`);
        }

        const mlRes = await mlClient.predictRetail(retailData);
        projectedScore = mlRes.score;
      }
    } catch (mlErr) {
      console.log("ML service failed during simulate, using fallback", mlErr);
      projectedScore = currentScore;
      explanations.push("ML Simulation unavailable, showing base score.");
    }

    const delta = projectedScore - currentScore;

    res.json({
      currentScore,
      projectedScore,
      delta: parseFloat(delta.toFixed(2)),
      change: parseFloat(delta.toFixed(2)),
      explanation: explanations.join('. ') || 'No changes simulated.',
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/portal/:customerId/simulate-transaction
const simulateTransaction = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { amount, category, merchantName, type } = req.body;

    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let newScore = 50;
    let mlStatus = 'Green';
    let txId = 'PENDING_ONCHAIN';

    const txEvent = { amount, category: category || 'general', merchantName, type, timestamp: new Date().toISOString() };

    try {
      if (customer.customerType === 'MSME') {
        const payload = { ...(customer.mlFeatures?.msme || { loan_amount: 100000, annual_income: 500000, dti: 0.3 }), amt: amount || 500, category: txEvent.category };
        const mlRes = await mlClient.predictMSME(payload);
        newScore = mlRes.vitt_chetak_index;
        mlStatus = mlRes.status;
      } else {
        const payload = { ...(customer.mlFeatures?.retail || { AMT_INCOME_TOTAL: 50000, AMT_CREDIT: 100000 }) };
        const mlRes = await mlClient.predictRetail(payload);
        newScore = mlRes.score;
        mlStatus = mlRes.risk_level;
      }

      // Record risk and transaction directly to Algorand for absolute immutability
      txId = await recordRiskTransactionOnChain(customerId, JSON.stringify(txEvent), newScore, mlStatus);

    } catch (mlErr) {
      console.error('ML API or Blockchain failed during transaction simulation', mlErr);
    }

    res.json({ success: true, transactionId: txId, newScore, status: mlStatus });
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

module.exports = { getHealthSummary, simulateScenario, simulateTransaction, updateAlertPreferences, requestCounsellor };
