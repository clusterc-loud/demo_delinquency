const mongoose = require('mongoose');

const fraudFlagSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  fraudScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  indicatorsTriggered: {
    circularMoneyFlow: { type: Boolean, default: false },
    unverifiedMerchants: { type: Boolean, default: false },
    patternTooRegular: { type: Boolean, default: false },
    netWorthDivergence: { type: Boolean, default: false },
    lifestyleVsDistress: { type: Boolean, default: false },
    multipleNewAccounts: { type: Boolean, default: false },
    agentInteractionAvoidance: { type: Boolean, default: false },
  },
  signalBreakdown: {
    circularMoneyFlow: { type: Number, default: 0 },
    unverifiedMerchants: { type: Number, default: 0 },
    patternTooRegular: { type: Number, default: 0 },
    netWorthDivergence: { type: Number, default: 0 },
    lifestyleVsDistress: { type: Number, default: 0 },
    multipleNewAccounts: { type: Number, default: 0 },
    agentInteractionAvoidance: { type: Number, default: 0 },
  },
  circularFlowData: [
    {
      from: String,
      to: String,
      amount: Number,
      date: Date,
    },
  ],
  netWorthTrend: [
    {
      month: String,
      netWorth: Number,
      healthScore: Number,
    },
  ],
  status: {
    type: String,
    enum: ['REVIEW', 'CLEARED', 'SUSPICIOUS', 'ESCALATED'],
    default: 'REVIEW',
  },
  analystId: {
    type: String,
  },
  resolutionDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FraudFlag', fraudFlagSchema);
