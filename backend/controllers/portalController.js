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

    // MSME Dashboard Data Expansion
    const isMSME = customer.customerType === 'MSME';
    const businessMetrics = isMSME ? {
      revenue: Math.round(latest.financialHealthScore * 125000), // Mock trend based on score
      profit: Math.round(latest.financialHealthScore * 32000),
      revenueTrend: [+5.2, -2.1, +1.8, +4.5, -0.5, +2.3],
      gstStatus: {
        lastFiled: 'March 2026',
        isPending: false,
        taxScore: 88,
        complianceRate: '98%'
      },
      loanSummary: {
        totalPending: (customer.emiSchedule || []).filter(e => e.status !== 'PAID').length,
        totalAmount: (customer.emiSchedule || []).reduce((acc, curr) => acc + (curr.status !== 'PAID' ? curr.amount : 0), 0),
        activeLoans: 1, // Default mock
      }
    } : null;

    res.json({
      score,
      band,
      summaryText: `Your financial health is ${band.toLowerCase().replace('_', ' ')}. ${strengths.length > 0 ? 'You have strong areas in ' + strengths.slice(0, 2).join(' and ') + '.' : ''}`,
      strengths: strengths.length > 0 ? strengths : ['Account in good standing'],
      attentionAreas: attentionAreas.length > 0 ? attentionAreas : ['No critical concerns at this time'],
      name: customer.name,
      customerId: customer.customerId,
      customerType: customer.customerType,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber,
      emiSchedule: customer.emiSchedule,
      fraudScore: latest.fraudScore || 0,
      status: latest.status,
      breakdown: latest.dimensionScores,
      businessMetrics,
      restructuringProposal: await Intervention.findOne({ 
        customerId: customer._id, 
        interventionType: { $in: ['EMI_RESTRUCTURE', 'PAYMENT_HOLIDAY'] },
        customerResponse: 'PENDING',
        adminStatus: 'APPROVED'
      }).sort({ timestamp: -1 }),
      hasPendingRequest: !!(await Intervention.findOne({
        customerId: customer._id,
        customerResponse: 'PENDING',
        adminStatus: 'PROPOSED'
      }).lean())
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/portal/:customerId/accept-restructure
const acceptRestructure = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { interventionId } = req.body;

    const customer = await Customer.findOne({ customerId });
    const intervention = await Intervention.findById(interventionId);

    if (!customer || !intervention) return res.status(404).json({ message: 'Data not found' });
    if (intervention.customerResponse !== 'PENDING') return res.status(400).json({ message: 'Already processed' });

    const plan = intervention.restructuringPlan;
    if (!plan) return res.status(400).json({ message: 'No plan details found' });

    // Execute the repair
    if (customer.customerType === 'RETAIL' && customer.mlFeatures?.retail) {
      customer.mlFeatures.retail.annuity = plan.revisedEmi;
    } else if (customer.customerType === 'MSME' && customer.mlFeatures?.msme) {
      customer.mlFeatures.msme.installment = plan.revisedEmi;
    }

    if (customer.emiSchedule) {
      customer.emiSchedule.forEach(emi => {
        if (emi.status === 'PENDING' || emi.status === 'OVERDUE') {
          emi.originalAmount = emi.amount;
          emi.amount = plan.revisedEmi;
          emi.isRestructured = true;
          emi.description = `Restructured: ${emi.description || 'EMI Payment'}`;
          if (emi.status === 'OVERDUE') emi.status = 'PENDING';
        }
      });
    }

    intervention.customerResponse = 'ACCEPTED';
    await intervention.save();
    await customer.save();

    // Recalculate score (simplified for now)
    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (riskScore) {
      riskScore.financialHealthScore = Math.min(100, Math.round(riskScore.financialHealthScore * 1.3)); 
      riskScore.patternDetected = 'HEALTHY';
      riskScore.priorityLevel = 'P5';
      await riskScore.save();
    }

    await recordRiskTransactionOnChain(customerId, `Accepted Restructuring Plan: ${interventionId}`, riskScore.financialHealthScore, 'Green');

    res.json({ success: true, message: 'Restructuring plan applied successfully!' });
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
    const score = latest ? latest.financialHealthScore : 45; // Default to critical for safety
    const band = score > 80 ? 'EXCELLENT' : score > 60 ? 'STABLE' : score > 40 ? 'WATCH' : 'CRITICAL';

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
    const { message } = req.body;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (!riskScore) {
      return res.status(404).json({ message: 'No risk score found' });
    }

    const intervention = await Intervention.create({
      customerId: customer._id,
      riskScoreId: riskScore._id,
      interventionType: 'EMI_RESTRUCTURE',
      channel: 'APP',
      messagePreview: message || 'Customer requested EMI Restructuring via portal',
      approvedBy: 'SELF_SERVICE',
      adminStatus: 'PROPOSED',
      customerResponse: 'PENDING',
      confidenceScore: 1.0,
    });

    await RiskScore.findByIdAndUpdate(riskScore._id, { 
      priorityLevel: 'P1', 
      status: 'PENDING',
      patternDetected: 'RESTRUCTURING_REQUESTED'
    });

    res.json({
      success: true,
      message: 'Bank Admin has been notified instantly.',
      interventionId: intervention._id
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/portal/:customerId/pay-emi/:emiId
const payEmi = async (req, res, next) => {
  try {
    const { customerId, emiId } = req.params;
    
    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const emi = customer.emiSchedule.find(e => e.emiId === emiId);
    if (!emi) return res.status(404).json({ message: 'EMI not found' });
    if (emi.status === 'PAID') return res.status(400).json({ message: 'EMI already paid' });

    emi.status = 'PAID';

    if (customer.mlFeatures && customer.mlFeatures.retail) {
      customer.mlFeatures.retail.creditAmount = Math.max(0, customer.mlFeatures.retail.creditAmount - emi.amount);
      customer.mlFeatures.retail.adjCloseHistory = customer.mlFeatures.retail.adjCloseHistory.map(v => v * 1.05);
    }
    
    await customer.save();

    let newScore = 80;
    try {
      const mlRes = await mlClient.predictRetail({
         customer_id: customerId,
         ...customer.mlFeatures.retail,
         AMT_INCOME_TOTAL: customer.mlFeatures.retail.income,
         AMT_CREDIT: customer.mlFeatures.retail.creditAmount,
         AMT_ANNUITY: customer.mlFeatures.retail.annuity,
         DAYS_BIRTH: -10000,
         DAYS_EMPLOYED: -300,
         REGION_POPULATION_RELATIVE: 0.02
      });
      newScore = mlRes.score;
    } catch(err) {
      console.warn("ML Fallback in payEMI");
    }

    const rs = await RiskScore.findOne({ customerId: customer._id });
    if (rs) {
      rs.financialHealthScore = newScore;
      if (newScore > 50) rs.patternDetected = 'HEALTHY';
      await rs.save();
    }

    const txId = await recordRiskTransactionOnChain(customerId, `Paid EMI ${emiId}`, newScore, newScore > 50 ? 'Green' : 'Red');

    res.json({ success: true, emiId, newScore, txId, emiSchedule: customer.emiSchedule });
  } catch (err) {
    next(err);
  }
};

// POST /api/portal/:customerId/market-shock
const simulateMarketShock = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (customer.mlFeatures && customer.mlFeatures.retail) {
      customer.mlFeatures.retail.adjCloseHistory = customer.mlFeatures.retail.adjCloseHistory.map(v => v * 0.4);
    }
    await customer.save();

    const rs = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (rs) {
      rs.financialHealthScore = 22;
      rs.patternDetected = 'LIQUIDITY_CRUNCH';
      rs.priorityLevel = 'P1';
      rs.status = 'PENDING';
      await rs.save();
      
      await Intervention.create({
        customerId: customer._id,
        riskScoreId: rs._id,
        interventionType: 'EMI_RESTRUCTURE',
        channel: 'ALGO_MONITOR',
        messagePreview: 'CRITICAL SHOCK DETECTED: 60% Liquidity Drop',
        approvedBy: 'SYSTEM',
        confidenceScore: 0.99,
      });
    }

    res.json({ success: true, message: 'Market shock simulated. Account flagged critical.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHealthSummary, simulateScenario, simulateTransaction, updateAlertPreferences, requestCounsellor, payEmi, simulateMarketShock };
