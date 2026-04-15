const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  asOfDate: {
    type: Date,
    default: Date.now,
  },
  financialHealthScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  priorityLevel: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4', 'P5'],
    required: true,
  },
  patternDetected: {
    type: String,
    enum: [
      'LIQUIDITY_CRUNCH',
      'EXPENSE_SHOCK',
      'INCOME_DISRUPTION',
      'DEBT_SPIRAL',
      'SAVINGS_DEPLETION',
      'WORKING_CAPITAL_CRUNCH',
      'DEMAND_COLLAPSE',
      'INPUT_COST_SHOCK',
      'CUSTOMER_CONCENTRATION',
      'SEASONAL_STRESS',
      'GROWTH_PAINS',
      'HEALTHY',
    ],
  },
  patternConfidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  survivalProbabilities: {
    week1: Number,
    week2: Number,
    week3: Number,
    week4: Number,
    week5: Number,
    week6: Number,
    week7: Number,
    week8: Number,
    week9: Number,
    week10: Number,
    week11: Number,
    week12: Number,
  },
  dimensionScores: {
    liquidityIndex: Number,
    incomeStability: Number,
    debtBurden: Number,
    portfolioHealth: Number,
    behavioralSignals: Number,
    networkRisk: Number,
  },
  shapSignals: [
    {
      signalName: String,
      currentValue: String,
      normalRange: String,
      impactPercent: Number,
    },
  ],
  interventionRecommended: {
    type: String,
    enum: [
      'PAYMENT_HOLIDAY',
      'EMI_RESTRUCTURE',
      'DEBT_CONSOLIDATION',
      'WORKING_CAPITAL_LOAN',
      'INVOICE_DISCOUNTING',
      'BUSINESS_ADVISORY',
      'COUNSELLOR_REFERRAL',
      'CREDIT_LIMIT_ADJUSTMENT',
    ],
  },
  slaDeadline: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['PENDING', 'INTERVENED', 'RESOLVED', 'ESCALATED', 'ARCHIVED'],
    default: 'PENDING',
  },
  distressPyramidLevel: {
    type: Number,
    min: 1,
    max: 8,
    default: 1,
  },
});

module.exports = mongoose.model('RiskScore', riskScoreSchema);
