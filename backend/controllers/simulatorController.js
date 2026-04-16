const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const mlService = require('../services/mlService');
const blockchainService = require('../services/blockchainService');

const simulateRetailTransaction = async (req, res, next) => {
  try {
    const { customerId, action } = req.body;
    const customer = await Customer.findOne({ customerId });
    if (!customer || customer.customerType !== 'RETAIL') return res.status(404).json({ message: 'Retail Customer not found' });

    let retail = customer.mlFeatures.retail;
    let transactionInfo = '';
    let fraudScore = 0;

    if (action === 'MISS_EMI') {
      retail.adjCloseHistory = (retail.adjCloseHistory || []).map(v => v * 0.8);
      retail.externalSource2 = Math.max(0.01, (retail.externalSource2 || 0.5) * 0.7);
      transactionInfo = 'FAILED_EMI_DEBIT';
    } else if (action === 'PAY_EMI') {
      retail.adjCloseHistory = (retail.adjCloseHistory || []).map(v => v * 1.1);
      retail.externalSource2 = Math.min(1.0, (retail.externalSource2 || 0.5) * 1.15);
      transactionInfo = 'SUCCESSFUL_EMI_PAYMENT';
    } else if (action === 'FRAUD_ALERT') {
      fraudScore = 88;
      transactionInfo = 'SUSPICIOUS_HIGH_VALUE_TX';
    } else {
      return res.status(400).json({ message: 'Invalid retail action' });
    }

    customer.mlFeatures.retail = retail;
    await customer.save();

    const mlResult = await mlService.predictRetail({
      customer_id: customerId,
      AMT_INCOME_TOTAL: retail.income || 500000,
      AMT_CREDIT: retail.creditAmount || 100000,
      AMT_ANNUITY: retail.annuity || 5000,
      DAYS_BIRTH: -10000,
      DAYS_EMPLOYED: retail.daysEmployed || -1000,
      EXT_SOURCE_2: retail.externalSource2,
      adj_close_history: retail.adjCloseHistory
    });

    let riskScore = await RiskScore.findOne({ customerId: customer._id });
    if (!riskScore) riskScore = new RiskScore({ customerId: customer._id });
    
    riskScore.financialHealthScore = mlResult.score;
    riskScore.fraudScore = fraudScore || riskScore.fraudScore;
    riskScore.asOfDate = new Date();
    
    if (mlResult.score < 50 || fraudScore > 80 || action === 'MISS_EMI' || action === 'FRAUD_ALERT') {
      riskScore.priorityLevel = 'P1';
      riskScore.status = 'PENDING';
      riskScore.patternDetected = fraudScore > 80 ? 'IDENTITY_THEFT_RISK' : 'LIQUIDITY_CRUNCH';
    }
    
    await riskScore.save();
    const txid = await blockchainService.recordRiskTransactionOnChain(customerId, transactionInfo, mlResult.score, riskScore.patternDetected);

    res.json({ success: true, action: transactionInfo, mlScore: mlResult.score, fraudScore, blockchainTxId: txid });
  } catch (error) {
    next(error);
  }
};

const simulateMSMETransaction = async (req, res, next) => {
  try {
    const { customerId, action } = req.body;
    const customer = await Customer.findOne({ customerId });
    if (!customer || customer.customerType !== 'MSME') return res.status(404).json({ message: 'MSME Customer not found' });

    let msme = customer.mlFeatures.msme;
    let transactionInfo = '';
    let fraudScore = 0;

    if (action === 'REVENUE_DROP') {
      msme.annualIncome = (msme.annualIncome || 5000000) * 0.4; // 60% drop
      msme.revolUtil = Math.min(1.0, (msme.revolUtil || 0.5) * 1.8); // 80% increase in utilization
      msme.dti = Math.min(1.0, (msme.dti || 0.3) * 1.5);
      transactionInfo = 'SUPPLY_CHAIN_DISRUPTION_DETECTED';
    } else if (action === 'LATE_PAYMENT') {
      msme.revolUtil = Math.min(1.0, (msme.revolUtil || 0.5) * 1.2);
      transactionInfo = 'LATE_RECEIVABLE_ENTRY';
    } else if (action === 'FRAUD_ALERT') {
      fraudScore = 92;
      transactionInfo = 'SUSPICIOUS_B2B_INVOICE_PATTERN';
    } else {
      return res.status(400).json({ message: 'Invalid MSME action' });
    }

    customer.mlFeatures.msme = msme;
    await customer.save();

    const mlResult = await mlService.predictMSME({ ...msme, customer_id: customerId });

    let riskScore = await RiskScore.findOne({ customerId: customer._id });
    if (!riskScore) riskScore = new RiskScore({ customerId: customer._id });

    riskScore.financialHealthScore = mlResult.vitt_chetak_index;
    riskScore.fraudScore = fraudScore || riskScore.fraudScore;
    riskScore.asOfDate = new Date();

    if (mlResult.vitt_chetak_index < 50 || fraudScore > 80 || action === 'REVENUE_DROP' || action === 'FRAUD_ALERT') {
      riskScore.priorityLevel = 'P1';
      riskScore.status = 'PENDING';
      riskScore.patternDetected = fraudScore > 80 ? 'FRAUDULENT_INVOICING' : 'REVENUE_CRUNCH';
    }

    await riskScore.save();
    const txid = await blockchainService.recordRiskTransactionOnChain(customerId, transactionInfo, mlResult.vitt_chetak_index, riskScore.patternDetected);

    res.json({ success: true, action: transactionInfo, mlScore: mlResult.vitt_chetak_index, fraudScore, blockchainTxId: txid });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  simulateRetailTransaction,
  simulateMSMETransaction
};
