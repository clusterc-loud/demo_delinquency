const RiskScore = require('../models/RiskScore');
const Customer = require('../models/Customer');

// GET /api/flagged
const getFlaggedAccounts = async (req, res, next) => {
  try {
    const { priority, customerType, pattern, fraudRisk, search, page = 1, limit = 20 } = req.query;

    // Build RiskScore filter
    const rsFilter = { status: 'PENDING' };
    if (priority) rsFilter.priorityLevel = priority;
    if (pattern) rsFilter.patternDetected = pattern;
    if (fraudRisk === 'true') rsFilter.fraudScore = { $gt: 50 };

    // Build Customer filter
    const custFilter = {};
    if (customerType) custFilter.customerType = customerType;

    let customerIds = null;
    if (search) {
      const customers = await Customer.find({
        $or: [
          { customerId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      customerIds = customers.map((c) => c._id);
      rsFilter.customerId = { $in: customerIds };
    }

    if (Object.keys(custFilter).length > 0 && !search) {
      const customers = await Customer.find(custFilter).select('_id');
      rsFilter.customerId = { $in: customers.map((c) => c._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await RiskScore.countDocuments(rsFilter);

    const scores = await RiskScore.find(rsFilter)
      .sort({ priorityLevel: 1, slaDeadline: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('customerId', 'name customerId customerType wealthSegment businessName');

    const accounts = scores.map((rs) => ({
      _id: rs._id,
      customerId: rs.customerId?.customerId || 'N/A',
      name: rs.customerId?.customerType === 'MSME'
        ? rs.customerId?.businessName || rs.customerId?.name
        : rs.customerId?.name,
      customerType: rs.customerId?.customerType,
      wealthSegment: rs.customerId?.wealthSegment,
      financialHealthScore: rs.financialHealthScore,
      priorityLevel: rs.priorityLevel,
      patternDetected: rs.patternDetected,
      fraudScore: rs.fraudScore,
      slaDeadline: rs.slaDeadline,
      status: rs.status,
      shapSignals: rs.shapSignals?.slice(0, 3),
      interventionRecommended: rs.interventionRecommended,
    }));

    res.json({
      accounts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/flagged/:customerId/preview
const getFlaggedPreview = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const latest = await RiskScore.findOne({ customerId: customer._id }).sort({ asOfDate: -1 });
    if (!latest) {
      return res.status(404).json({ message: 'No risk score found' });
    }

    res.json({
      shapSignals: (latest.shapSignals || []).slice(0, 3),
      week4SurvivalProb: latest.survivalProbabilities?.week4 || null,
      interventionRecommended: latest.interventionRecommended,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFlaggedAccounts, getFlaggedPreview };
