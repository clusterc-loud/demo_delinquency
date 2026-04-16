const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const mlService = require('../services/mlService');
const blockchainService = require('../services/blockchainService');

const simulateRetailTransaction = async (req, res, next) => {
  try {
    const { customerId, action } = req.body;
    
    // 1. Fetch Customer
    const customer = await Customer.findOne({ customerId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (!customer.mlFeatures || !customer.mlFeatures.retail) {
      return res.status(400).json({ message: 'Retail features missing for this customer' });
    }

    let retail = customer.mlFeatures.retail;
    let transactionInfo = '';

    // 2. Adjust Features based on action
    if (action === 'MISS_EMI') {
      // Degrade liquidity series
      retail.adjCloseHistory = retail.adjCloseHistory.map(v => v * 0.9);
      // Degrade external source mapping defaults
      retail.externalSource2 = Math.max(0.01, retail.externalSource2 * 0.8);
      transactionInfo = 'FAILED_EMI_DEBIT';
    } else if (action === 'PAY_EMI') {
      // Improve liquidity series
      retail.adjCloseHistory = retail.adjCloseHistory.map(v => v * 1.05);
      retail.externalSource2 = Math.min(1.0, retail.externalSource2 * 1.1);
      transactionInfo = 'SUCCESSFUL_EMI_PAYMENT';
    } else {
      return res.status(400).json({ message: 'Invalid action specified' });
    }

    // Save adjusted features
    customer.mlFeatures.retail = retail;
    await customer.save();

    // 3. Call ML Service
    const mlPayload = {
      customer_id: customerId,
      AMT_INCOME_TOTAL: retail.income || 500000,
      AMT_CREDIT: retail.creditAmount || 100000,
      AMT_ANNUITY: retail.annuity || 5000,
      AMT_GOODS_PRICE: retail.goodsPrice || 100000,
      REGION_POPULATION_RELATIVE: retail.regionRating || 0.02,
      DAYS_BIRTH: -10000,
      DAYS_EMPLOYED: retail.daysEmployed || -1000,
      EXT_SOURCE_2: retail.externalSource2,
      EXT_SOURCE_3: retail.externalSource3,
      adj_close_history: retail.adjCloseHistory
    };

    const mlResult = await mlService.predictRetail(mlPayload);
    const newScore = mlResult.score; // 0-100

    // 4. Update Risk Score Document
    let riskScore = await RiskScore.findOne({ customerId: customer._id });
    if (!riskScore) {
       riskScore = new RiskScore({ customerId: customer._id });
    }
    riskScore.financialHealthScore = newScore;
    riskScore.asOfDate = new Date();
    
    // Determine priority and pattern based on new score
    if (newScore < 50) {
      riskScore.priorityLevel = 'P1';
      riskScore.patternDetected = 'LIQUIDITY_CRUNCH';
      riskScore.status = riskScore.status === 'RESOLVED' ? 'PENDING' : riskScore.status; // reopen if failing again
      riskScore.interventionRecommended = 'EMI_RESTRUCTURE';
    } else if (newScore < 75) {
      riskScore.priorityLevel = 'P3';
      riskScore.patternDetected = 'EXPENSE_SHOCK';
    } else {
      riskScore.priorityLevel = 'P5';
      riskScore.patternDetected = 'HEALTHY';
    }
    
    await riskScore.save();

    // 5. Anchor to Blockchain
    const txid = await blockchainService.recordRiskTransactionOnChain(
      customerId,
      transactionInfo,
      newScore,
      riskScore.patternDetected
    );

    res.json({
      success: true,
      action: transactionInfo,
      mlScore: newScore,
      blockchainTxId: txid,
      riskScore: riskScore
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  simulateRetailTransaction
};
