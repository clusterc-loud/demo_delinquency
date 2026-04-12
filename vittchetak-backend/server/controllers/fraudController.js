const FraudFlag = require('../models/FraudFlag');
const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');

// GET /api/fraud
const getFraudCases = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const flags = await FraudFlag.find(filter)
      .sort({ fraudScore: -1, createdAt: -1 })
      .populate('customerId', 'name customerId customerType businessName');

    const result = flags.map((f) => ({
      _id: f._id,
      customerId: f.customerId?.customerId,
      customerName:
        f.customerId?.customerType === 'MSME'
          ? f.customerId?.businessName || f.customerId?.name
          : f.customerId?.name,
      customerType: f.customerId?.customerType,
      fraudScore: f.fraudScore,
      indicatorsTriggered: f.indicatorsTriggered,
      status: f.status,
      createdAt: f.createdAt,
    }));

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

    res.json({
      fraudScore: flag.fraudScore,
      signalBreakdown: flag.signalBreakdown,
      indicatorsTriggered: flag.indicatorsTriggered,
      circularFlowData: flag.circularFlowData,
      netWorthTrend: flag.netWorthTrend,
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

    res.json({ success: true, status: flag.status });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFraudCases, getFraudEvidence, recordDecision };
