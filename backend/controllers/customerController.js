const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const mlClient = require('../utils/mlClient');
const { recordRiskTransactionOnChain } = require('../services/blockchainService');



// Helper to unify profile response shape for all profile-related endpoints
const mapProfileResponse = (customer, scores) => {
  const latest = scores[0];
  const score = latest?.financialHealthScore ?? 50;
  const dims = latest?.dimensionScores || {};

  // Map internal dimension keys to human-readable display names
  const dimensionScores = {
    'Cash Flow Stability':   Math.round(dims.liquidityIndex   ?? 50),
    'Debt Servicing':        Math.round(100 - (dims.debtBurden ?? 50)),
    'Operational Continuity':Math.round(dims.portfolioHealth  ?? 50),
    'Revenue Diversification':Math.round(dims.incomeStability ?? 50),
    'Ecosystem Dependency':  Math.round(100 - (dims.networkRisk ?? 50)),
  };

  // Build 6-month survival curve from historical scores
  const survivalData = scores.slice().reverse().map((rs, i) => ({
    month: i + 1,
    probability: Math.round((rs.survivalProbabilities?.week4 ?? 0.5) * 100),
  }));
  
  if (survivalData.length === 0) {
    for (let i = 1; i <= 6; i++) survivalData.push({ month: i, probability: Math.max(10, score - i * 5) });
  }

  // Build intervention timeline from risk score history
  const timeline = scores.slice(0, 3).map((rs) => ({
    date: new Date(rs.asOfDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    action: `AI Health Score Update — Pattern: ${(rs.patternDetected || 'HEALTHY').replace(/_/g, ' ')}`,
    outcome: `Score: ${rs.financialHealthScore}`,
    type: 'score',
  }));

  if (timeline.length === 0) {
    timeline.push({ date: 'N/A', action: 'No history yet', outcome: '—', type: 'score' });
  }

  const stressLabel = score < 40 ? 'Critical — Immediate Intervention Required'
    : score < 60 ? 'Moderate — Early Warning Detected'
    : 'Healthy — No Immediate Concerns';

  return {
    id:       customer.customerId,
    name:     customer.customerType === 'MSME'
                ? (customer.businessName || customer.name)
                : customer.name,
    segment:  customer.customerType,
    regNo:    customer.gstNumber || customer.customerId,
    riskScore: score,
    stressLabel,
    dimensionScores,
    survivalData,
    timeline,
    networkRisk: {
      exposedEntities:       Math.round(dims.networkRisk / 10) + 2,
      contagionProbability:  Math.round(dims.networkRisk ?? 30),
      directExposure:        `₹${Math.round((dims.networkRisk ?? 30) * 1.5)}L`,
    },
    shapSignals: latest?.shapSignals || [],
    patternDetected: latest?.patternDetected,
  };
};

// GET /api/customer/:customerId/profile
const getCustomerProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const allScores = await RiskScore.find({ customerId: customer._id })
      .sort({ asOfDate: -1 })
      .limit(6);

    res.json(mapProfileResponse(customer, allScores));
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
    
    // Simple deterministic hash
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return Math.abs(h);
    };
    const hval = hash(customerId);
    
    const networkStressScore = riskScore?.dimensionScores?.networkRisk || ((hval % 60) + 20);

    res.json({
      suppliersInDistress: (hval % 5) + 1,
      totalSuppliers: (hval % 6) + 5,
      customersInDistress: (hval % 4),
      totalCustomers: (hval % 6) + 3,
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

    let newScore = 50;
    let newFraudScore = 10;
    let mlStatus = 'Green';
    let pattern = latest ? latest.patternDetected : 'HEALTHY';
    let newDimensions = latest ? { ...latest.dimensionScores } : {};

    try {
      if (customer.customerType === 'MSME') {
        const f = customer.mlFeatures?.msme || {};
        const payload = {
          loan_amount:        f.loanAmount        || 150000,
          annual_income:      f.annualIncome      || 600000,
          installment:        f.installment       || 5000,
          dti:                f.dti               || 0.3,
          int_rate:           f.intRate           || 0.12,
          revol_util:         f.revolUtil         || 0.3,
          inquiries_last_12m: f.inquiriesLast12m  || 1,
          term:               f.term              || 36,
          no_emp:             f.noEmp             || 5,
          new_exist:          f.newExist          || 1,
          create_job:         f.createJob         || 0,
          retained_job:       f.retainedJob       || 0,
          urban_rural:        f.urbanRural        || 1,
          disbursement_gross: f.disbursementGross || 50000,
          gr_appv:            f.grAppv            || 50000,
          sba_appv:           f.sbaAppv           || 40000,
          real_estate:        f.realEstate        || 0,
          portion:            f.portion           || 0.8,
          amt:                500,
          category:           'food_dining',
          gender:             'M',
        };
        const mlRes = await mlClient.predictMSME(payload);
        newScore = mlRes.vitt_chetak_index;
        mlStatus = mlRes.status;
        newDimensions.liquidityIndex    = Math.round(mlRes.breakdown.credit_health);
        newDimensions.portfolioHealth   = Math.round(mlRes.breakdown.growth_potential);
        newDimensions.behavioralSignals = Math.round(mlRes.breakdown.safety_shield);
        newDimensions.debtBurden        = Math.round(100 - mlRes.breakdown.credit_health);
        newDimensions.networkRisk       = Math.round(100 - mlRes.breakdown.safety_shield);
        newFraudScore = Math.round(100 - mlRes.breakdown.safety_shield);
      } else {
        const f = customer.mlFeatures?.retail || {};
        const payload = {
          customer_id:                    customer.customerId,
          AMT_INCOME_TOTAL:               f.income               || 65000,
          AMT_CREDIT:                     f.creditAmount         || 120000,
          AMT_ANNUITY:                    f.annuity              || 5000,
          AMT_GOODS_PRICE:                f.goodsPrice           || null,
          DAYS_BIRTH:                     f.daysBirth            || -12000,
          DAYS_EMPLOYED:                  f.daysEmployed         || -2000,
          EXT_SOURCE_2:                   f.externalSource2      || 0.5,
          EXT_SOURCE_3:                   f.externalSource3      || 0.5,
          REGION_POPULATION_RELATIVE:     f.regionPopulationRelative || 0.02,
          adj_close_history:              f.adjCloseHistory      || null,
        };
        const mlRes = await mlClient.predictRetail(payload);
        newScore    = mlRes.score;
        mlStatus    = mlRes.risk_level;
        const r1Risk = mlRes.breakdown?.r1?.default_risk  || 0.3;
        const r2Liq  = mlRes.breakdown?.r2?.liquidity_stress || 0.2;
        const r3Frd  = mlRes.breakdown?.r3?.fraud_prob    || 0.1;
        newDimensions.liquidityIndex    = Math.round((1 - r2Liq) * 100);
        newDimensions.incomeStability   = Math.round((1 - r1Risk) * 100);
        newDimensions.portfolioHealth   = Math.round(newScore);
        newDimensions.debtBurden        = Math.round(r1Risk * 100);
        newDimensions.behavioralSignals = Math.round((1 - r3Frd) * 100);
        newDimensions.networkRisk       = Math.round(r3Frd * 100);
        newFraudScore = Math.round(r3Frd * 100);
      }
    } catch (mlErr) {
      console.error('ML API failed during rescore, using previous score as fallback:', mlErr.message);
      newScore = latest ? latest.financialHealthScore : 50;
    }

    let newPriority;
    if (newScore >= 80) newPriority = 'P5';
    else if (newScore >= 60) newPriority = 'P4';
    else if (newScore >= 40) newPriority = 'P3';
    else if (newScore >= 20) newPriority = 'P2';
    else newPriority = 'P1';

    const newRiskScore = await RiskScore.create({
      customerId: customer._id,
      asOfDate: new Date(),
      financialHealthScore: newScore,
      priorityLevel: newPriority,
      patternDetected: pattern,
      patternConfidence: 0.85,
      fraudScore: newFraudScore,
      dimensionScores: newDimensions,
      survivalProbabilities: latest ? latest.survivalProbabilities : { week1: 0.9, week4: 0.8 },
      shapSignals: latest ? latest.shapSignals : [],
      interventionRecommended: latest ? latest.interventionRecommended : 'BUSINESS_ADVISORY',
      slaDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: 'PENDING',
    });

    // Anchor to Algorand Smart Contract automatically when rescored
    await recordRiskTransactionOnChain(
      customer.customerId, 
      `BANK_RESERVE_RECALC_${newPriority}`, 
      newRiskScore.financialHealthScore,
      newRiskScore.status
    );

    // Fetch updated history including the brand new score
    const updatedScores = await RiskScore.find({ customerId: customer._id })
      .sort({ asOfDate: -1 })
      .limit(6);

    // Return the full unified profile object
    res.json(mapProfileResponse(customer, updatedScores));
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomerProfile, getInterventionHistory, getNetworkRisk, rescoreCustomer };
