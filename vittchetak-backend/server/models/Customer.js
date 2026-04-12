const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: true,
  },
  customerType: {
    type: String,
    enum: ['RETAIL', 'MSME'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ageBracket: {
    type: String,
    enum: ['18-25', '26-35', '36-45', '46-55', '55+'],
  },
  occupationCategory: {
    type: String,
  },
  cityTier: {
    type: Number,
    enum: [1, 2, 3],
  },
  wealthSegment: {
    type: String,
    enum: ['AFFLUENT', 'MIDDLE', 'LOWER_MIDDLE', 'STRUGGLING'],
  },
  maritalStatusInferred: {
    type: String,
    enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // MSME-specific fields
  businessName: { type: String },
  industrySector: { type: String },
  businessAgeYears: { type: Number },
  gstNumber: { type: String },
  annualTurnoverBand: { type: String },
  employeeCount: { type: Number },
  // Alert preferences (portal)
  alertPreferences: {
    lowBalance: { type: Boolean, default: true },
    paymentReminder: { type: Boolean, default: true },
    scoreChange: { type: Boolean, default: true },
    quietHoursStart: { type: String, default: '22:00' },
    quietHoursEnd: { type: String, default: '07:00' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Customer', customerSchema);
