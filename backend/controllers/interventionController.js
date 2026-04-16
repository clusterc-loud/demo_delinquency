const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const { recordRiskTransactionOnChain } = require('../services/blockchainService');

const MESSAGE_TEMPLATES = {
  LIQUIDITY_CRUNCH: (name) =>
    `Dear ${name}, we noticed your account balance has been under pressure recently. We'd like to offer you a 30-day payment holiday on your EMI — no impact on your credit score. Reply YES to activate.`,
  EXPENSE_SHOCK: (name) =>
    `Dear ${name}, unexpected expenses can happen to anyone. Our EMI restructuring plan can reduce your monthly payment by up to 30%. Would you like to know more?`,
  INCOME_DISRUPTION: (name) =>
    `Dear ${name}, we understand income disruptions can be stressful. We've pre-approved a 3-month reduced EMI plan for you. No paperwork needed.`,
  DEBT_SPIRAL: (name) =>
    `Dear ${name}, managing multiple loans can be overwhelming. Our debt consolidation plan combines all your loans into one simple payment. Shall we show you your options?`,
  SAVINGS_DEPLETION: (name) =>
    `Dear ${name}, your savings trend is showing signs of depletion. Let's talk about a proactive restructuring before it impacts your credit standing. Free consultation available.`,
  WORKING_CAPITAL_CRUNCH: (name) =>
    `Dear ${name}, your GST history qualifies you for a working capital loan of up to ₹10L — approved in 2 hours. Interested?`,
  DEMAND_COLLAPSE: (name) =>
    `Dear ${name}, our MSME advisory team can help you navigate this business challenge. Would you like a free consultation with our specialist?`,
  INPUT_COST_SHOCK: (name) =>
    `Dear ${name}, rising input costs are a sector-wide challenge. We have a tailored invoice discounting facility that can improve your cash cycle by 45 days.`,
  CUSTOMER_CONCENTRATION: (name) =>
    `Dear ${name}, our data suggests your business has high client concentration risk. Our business advisory program can help you diversify your receivables.`,
  SEASONAL_STRESS: (name) =>
    `Dear ${name}, seasonal cash flow gaps are manageable. We offer a seasonal credit line with flexible draw-down — repay when your cycle peaks.`,
  GROWTH_PAINS: (name) =>
    `Dear ${name}, growth is good but rapid scaling can strain cash flow. Let us structure a working capital solution aligned with your expansion.`,
  HEALTHY: (name) =>
    `Dear ${name}, your financial health looks great! We've pre-approved an enhanced credit limit as a reward for your excellent repayment track record.`,
};

const PATTERN_TO_INTERVENTION = {
  LIQUIDITY_CRUNCH: 'PAYMENT_HOLIDAY',
  EXPENSE_SHOCK: 'EMI_RESTRUCTURE',
  INCOME_DISRUPTION: 'EMI_RESTRUCTURE',
  DEBT_SPIRAL: 'DEBT_CONSOLIDATION',
  SAVINGS_DEPLETION: 'CREDIT_LIMIT_ADJUSTMENT',
  WORKING_CAPITAL_CRUNCH: 'WORKING_CAPITAL_LOAN',
  DEMAND_COLLAPSE: 'BUSINESS_ADVISORY',
  INPUT_COST_SHOCK: 'INVOICE_DISCOUNTING',
  CUSTOMER_CONCENTRATION: 'BUSINESS_ADVISORY',
  SEASONAL_STRESS: 'WORKING_CAPITAL_LOAN',
  GROWTH_PAINS: 'WORKING_CAPITAL_LOAN',
  HEALTHY: 'CREDIT_LIMIT_ADJUSTMENT',
};

// GET /api/interventions/queue
const getQueue = async (req, res, next) => {
  try {
    const pending = await RiskScore.find({ status: 'PENDING' })
      .sort({ priorityLevel: 1 }) // P1 at top
      .populate('customerId', 'name customerId customerType businessName');

    const queue = await Promise.all(pending.map(async (rs) => {
      const now = new Date();
      const diffMs = rs.slaDeadline ? new Date(rs.slaDeadline) - now : 24 * 60 * 60 * 1000;
      
      const latestIntervention = await Intervention.findOne({ riskScoreId: rs._id }).sort({ createdAt: -1 });
      
      return {
        _id: rs._id,
        id: rs.customerId?.customerId || rs._id.toString(),
        name: rs.customerId?.customerType === 'MSME'
            ? rs.customerId?.businessName || rs.customerId?.name
            : rs.customerId?.name,
        segment: rs.customerId?.customerType,
        priority: rs.priorityLevel,
        slaHours: Math.max(0, diffMs / (1000 * 60 * 60)),
        interventionType: rs.interventionRecommended || PATTERN_TO_INTERVENTION[rs.patternDetected] || 'BUSINESS_ADVISORY',
        healthScore: rs.financialHealthScore,
        customerMessage: latestIntervention?.messagePreview || null
      };
    }));

    res.json({ queue });
  } catch (err) {
    next(err);
  }
};

// GET /api/interventions/:customerId/generate-message
const generateMessage = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    const pattern = riskScore?.patternDetected || 'HEALTHY';
    const displayName =
      customer.customerType === 'MSME' ? customer.businessName || customer.name : customer.name;

    const template = MESSAGE_TEMPLATES[pattern] || MESSAGE_TEMPLATES.HEALTHY;
    const interventionType =
      riskScore?.interventionRecommended || PATTERN_TO_INTERVENTION[pattern] || 'BUSINESS_ADVISORY';
      
    let message = template(displayName);
    if (pattern === 'HEALTHY' && (interventionType === 'EMI_RESTRUCTURE' || interventionType === 'PAYMENT_HOLIDAY')) {
      message = `Dear ${displayName}, we've received your request for restructuring. Our AI has proposed a revised plan to support your business continuity.`;
    }

    // AI logic for explainability
    const logic = riskScore?.dynamicExplainability || `Analysis of ${displayName}'s risk patterns suggests ${interventionType.replace('_', ' ')} due to ${pattern.replace('_', ' ')}.`;

    let restructurePreview = null;
    // Always provide a restructure workshop for HIGH RISK users to allow Admin intervention
    if (interventionType === 'EMI_RESTRUCTURE' || interventionType === 'PAYMENT_HOLIDAY' || (riskScore?.financialHealthScore < 40)) {
      const currentEmi = (customer.emiSchedule || []).find(e => e.status !== 'PAID')?.amount || 
                         (customer.customerType === 'RETAIL' ? 15000 : 45000);
      
      restructurePreview = {
        originalEmi: currentEmi,
        revisedEmi: Math.round(currentEmi * 0.75),
        tenureExtensionMonths: 6,
        logic: logic
      };
    }

    res.json({
      message,
      confidenceScore: 0.85,
      interventionType,
      channel: 'SMS',
      restructurePreview,
      logic
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/interventions/:customerId/approve
const approveIntervention = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { interventionType, channel, messagePreview, approvedBy, planDetails } = req.body;

    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (!riskScore) return res.status(404).json({ message: 'No risk score found' });

    // Check if an existing intervention for this customer already exists (Transition flow)
    let intervention = await Intervention.findOne({
      customerId: customer._id,
      interventionType,
      customerResponse: 'PENDING',
      adminStatus: 'PROPOSED'
    }).sort({ timestamp: -1 });

    if (intervention) {
      // Transition EXISTING intervention
      intervention.adminStatus = 'APPROVED';
      intervention.channel = channel || intervention.channel;
      intervention.messagePreview = messagePreview || intervention.messagePreview;
      intervention.restructuringPlan = planDetails || intervention.restructuringPlan;
      intervention.approvedBy = approvedBy || 'ADMIN_WORKSHOP';
      await intervention.save();
    } else {
      // Create NEW intervention (Proactive flow)
      intervention = await Intervention.create({
        customerId: customer._id,
        riskScoreId: riskScore._id,
        interventionType,
        channel: channel || 'APP',
        messagePreview: messagePreview || '',
        approvedBy: approvedBy || 'ADMIN',
        adminStatus: 'APPROVED',
        customerResponse: 'PENDING',
        restructuringPlan: planDetails || null,
        confidenceScore: 0.9
      });
    }

    await RiskScore.findByIdAndUpdate(riskScore._id, { status: 'INTERVENED' });

    res.json({ success: true, intervention, message: 'Plan sent to customer for final acceptance.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/interventions/:customerId/route-to-rm
const routeToRM = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const riskScore = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (riskScore) {
      await RiskScore.findByIdAndUpdate(riskScore._id, { status: 'ESCALATED' });
    }

    res.json({ success: true, message: 'Routed to Relationship Manager' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getQueue, generateMessage, approveIntervention, routeToRM };
