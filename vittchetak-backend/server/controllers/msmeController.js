const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

    // Generate realistic edges — each node connects to 2-4 others
    const edges = [];
    const paymentStatuses = ['ON_TIME', 'ON_TIME', 'DELAYED', 'DEFAULTED'];
    const nodeIds = nodes.map((n) => n.id);

    nodes.forEach((node, i) => {
      const connectionCount = rand(2, 4);
      const usedTargets = new Set();
      for (let c = 0; c < connectionCount; c++) {
        let targetIdx;
        let attempts = 0;
        do {
          targetIdx = rand(0, nodeIds.length - 1);
          attempts++;
        } while ((targetIdx === i || usedTargets.has(targetIdx)) && attempts < 20);

        if (targetIdx !== i && !usedTargets.has(targetIdx)) {
          usedTargets.add(targetIdx);
          edges.push({
            source: node.id,
            target: nodeIds[targetIdx],
            paymentStatus: paymentStatuses[rand(0, paymentStatuses.length - 1)],
            volume: rand(100000, 5000000),
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

    const path = [msmeId, ...connected.map((c) => c.customerId).slice(0, rand(2, 4))];

    res.json({ path, length: path.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMSMEGraph, getContagionPath };
