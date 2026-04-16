const FraudFlag = require('../models/FraudFlag');
const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const { recordRiskTransactionOnChain } = require('../services/blockchainService');

const SIGNAL_LABELS = {
  circularMoneyFlow: 'Circular Fund Flow',
  unverifiedMerchants: 'Unverified Merchants',
  patternTooRegular: 'Pattern Too Regular',
  netWorthDivergence: 'Net Worth Divergence',
  lifestyleVsDistress: 'Lifestyle vs. Distress',
  multipleNewAccounts: 'Multiple New Accounts',
  agentInteractionAvoidance: 'Agent Avoidance',
};

// GET /api/fraud/stats
const getFraudStats = async (req, res, next) => {
  try {
    const [total, review, suspicious, escalated, cleared] = await Promise.all([
      FraudFlag.countDocuments(),
      FraudFlag.countDocuments({ status: 'REVIEW' }),
      FraudFlag.countDocuments({ status: 'SUSPICIOUS' }),
      FraudFlag.countDocuments({ status: 'ESCALATED' }),
      FraudFlag.countDocuments({ status: 'CLEARED' }),
    ]);

    const allFlags = await FraudFlag.find();
    const avgScore = allFlags.length > 0
      ? Math.round(allFlags.reduce((sum, f) => sum + f.fraudScore, 0) / allFlags.length)
      : 0;

    // Find the most common triggered signal
    const signalCounts = {};
    allFlags.forEach(f => {
      if (f.indicatorsTriggered) {
        Object.entries(f.indicatorsTriggered.toObject()).forEach(([key, val]) => {
          if (val && key !== '_id') {
            signalCounts[key] = (signalCounts[key] || 0) + 1;
          }
        });
      }
    });
    const topSignal = Object.entries(signalCounts).sort((a, b) => b[1] - a[1])[0];

    res.json({
      total,
      review,
      suspicious,
      escalated,
      cleared,
      avgScore,
      topSignal: topSignal ? { name: SIGNAL_LABELS[topSignal[0]] || topSignal[0], count: topSignal[1] } : null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/fraud
const getFraudCases = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const flags = await FraudFlag.find(filter)
      .sort({ fraudScore: -1, createdAt: -1 })
      .populate('customerId', 'name customerId customerType businessName');

    const result = flags.map((f) => {
      // Calculate exposure from circular flow data
      const exposure = f.circularFlowData
        ? f.circularFlowData.reduce((sum, flow) => sum + (flow.amount || 0), 0)
        : 0;

      return {
        _id: f._id,
        customerId: f.customerId?.customerId,
        customerName:
          f.customerId?.customerType === 'MSME'
            ? f.customerId?.businessName || f.customerId?.name
            : f.customerId?.name,
        customerType: f.customerId?.customerType,
        fraudScore: f.fraudScore,
        indicatorsTriggered: f.indicatorsTriggered,
        exposure,
        status: f.status,
        createdAt: f.createdAt,
      };
    });

    res.json({ accounts: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/fraud/:customerId/evidence
const getFraudEvidence = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const flag = await FraudFlag.findOne({ customerId: customer._id });
    if (!flag) {
      return res.status(404).json({ message: 'No fraud flag found for this customer' });
    }

    // Build human-readable signal breakdown
    const signals = [];
    if (flag.signalBreakdown) {
      const breakdown = flag.signalBreakdown.toObject ? flag.signalBreakdown.toObject() : flag.signalBreakdown;
      Object.entries(breakdown).forEach(([key, score]) => {
        if (key !== '_id' && score > 0) {
          signals.push({
            key,
            label: SIGNAL_LABELS[key] || key,
            score,
            triggered: flag.indicatorsTriggered?.[key] || false,
          });
        }
      });
      signals.sort((a, b) => b.score - a.score);
    }

    res.json({
      fraudScore: flag.fraudScore,
      signals,
      circularFlowData: flag.circularFlowData || [],
      netWorthTrend: flag.netWorthTrend || [],
      status: flag.status,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/fraud/:customerId/decision
const recordDecision = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { status, analystId, decision } = req.body;

    const resolvedStatus = status || decision;
    const validStatuses = ['REVIEW', 'CLEARED', 'SUSPICIOUS', 'ESCALATED'];
    if (!validStatuses.includes(resolvedStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updateData = {
      status: resolvedStatus,
      analystId: analystId || 'EMP-0001',
    };
    if (resolvedStatus === 'CLEARED') {
      updateData.resolutionDate = new Date();
    }

    const flag = await FraudFlag.findOneAndUpdate(
      { customerId: customer._id },
      updateData,
      { new: true }
    );

    if (!flag) {
      return res.status(404).json({ message: 'Fraud flag not found' });
    }

    // If cleared, reset risk score status back to PENDING
    if (resolvedStatus === 'CLEARED') {
      await RiskScore.findOneAndUpdate(
        { customerId: customer._id, status: { $in: ['ESCALATED', 'ARCHIVED'] } },
        { status: 'PENDING' }
      );
    }

    // Anchor decision to blockchain
    try {
      const txId = await recordRiskTransactionOnChain(
        customer.customerId,
        `Fraud Decision: ${resolvedStatus}`,
        flag.fraudScore,
        resolvedStatus === 'CLEARED' ? 'Green' : 'Red'
      );
      return res.json({ success: true, status: flag.status, txId });
    } catch (chainErr) {
      console.warn('[Fraud] Blockchain anchor failed:', chainErr.message);
    }

    res.json({ success: true, status: flag.status });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFraudStats, getFraudCases, getFraudEvidence, recordDecision };
