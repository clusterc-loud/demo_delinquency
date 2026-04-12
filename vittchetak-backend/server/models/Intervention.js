const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  riskScoreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RiskScore',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  interventionType: {
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
    required: true,
  },
  channel: {
    type: String,
    enum: ['SMS', 'EMAIL', 'APP', 'RM_CALL'],
    required: true,
  },
  messageHash: {
    type: String,
  },
  messagePreview: {
    type: String,
    maxlength: 200,
  },
  approvedBy: {
    type: String,
  },
  customerResponse: {
    type: String,
    enum: ['ACCEPTED', 'DECLINED', 'NO_RESPONSE', 'PENDING'],
    default: 'PENDING',
  },
  outcome30d: {
    type: String,
    enum: ['RECOVERED', 'STILL_AT_RISK', 'DEFAULTED', 'PENDING'],
    default: 'PENDING',
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
  },
});

module.exports = mongoose.model('Intervention', interventionSchema);
