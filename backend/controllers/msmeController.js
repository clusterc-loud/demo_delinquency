const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');


// GET /api/msme/graph
const getMSMEGraph = async (req, res, next) => {
  try {
    const msmeCustomers = await Customer.find({ customerType: 'MSME', isActive: true }).limit(80);

    const riskScores = await RiskScore.find({
      customerId: { $in: msmeCustomers.map((c) => c._id) },
    }).sort({ asOfDate: -1 });

    // Latest score per customer
    const latestByCustomer = {};
    riskScores.forEach((rs) => {
      const key = rs.customerId.toString();
      if (!latestByCustomer[key]) latestByCustomer[key] = rs;
    });

    const getDistressLevel = (score) => {
      if (score >= 75) return 'HEALTHY';
      if (score >= 50) return 'WATCH';
      if (score >= 25) return 'HIGH';
      return 'CRITICAL';
    };

    const nodes = msmeCustomers.map((c) => {
      const rs = latestByCustomer[c._id.toString()];
      return {
        id: c.customerId,
        businessName: c.businessName || c.name,
        sector: c.industrySector || 'General',
        healthScore: rs?.financialHealthScore || 50,
        distressLevel: getDistressLevel(rs?.financialHealthScore || 50),
      };
    });

    // Generate deterministic edges based on IDs — each node connects to 2-3 others
    const edges = [];
    const paymentStatuses = ['ON_TIME', 'ON_TIME', 'DELAYED', 'DEFAULTED'];
    const nodeIds = nodes.map((n) => n.id);

    // Simple deterministic hash
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return Math.abs(h);
    };

    nodes.forEach((node, i) => {
      const hval = hash(node.id);
      const connectionCount = (hval % 2) + 2; // 2 or 3 connections
      const usedTargets = new Set();
      for (let c = 0; c < connectionCount; c++) {
        const targetIdx = (hval + c * 7) % nodeIds.length;
        if (targetIdx !== i && !usedTargets.has(targetIdx)) {
          usedTargets.add(targetIdx);
          edges.push({
            source: node.id,
            target: nodeIds[targetIdx],
            paymentStatus: paymentStatuses[(hval + c) % paymentStatuses.length],
            volume: ((hval % 10) + 1) * 50000 + c * 25000,
          });
        }
      }
    });

    res.json({ nodes, edges });
  } catch (err) {
    next(err);
  }
};

// GET /api/msme/contagion-path/:msmeId
const getContagionPath = async (req, res, next) => {
  try {
    const { msmeId } = req.params;

    // Find the MSME customer
    const customer = await Customer.findOne({ customerId: msmeId });
    if (!customer) {
      return res.status(404).json({ message: 'MSME not found' });
    }

    // Get connected MSME customers (simulation)
    const connected = await Customer.find({ customerType: 'MSME', isActive: true })
      .limit(5)
      .select('customerId');

    // Deterministic path
    let h = 0;
    for (let i = 0; i < msmeId.length; i++) h = Math.imul(31, h) + msmeId.charCodeAt(i) | 0;
    const len = (Math.abs(h) % 3) + 2;
    const path = [msmeId, ...connected.map((c) => c.customerId).slice(0, len)];

    res.json({ path, length: path.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMSMEGraph, getContagionPath };
