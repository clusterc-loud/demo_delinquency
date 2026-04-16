const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
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
  supplyChainPartners: [
    { name: { type: String }, status: { type: String, enum: ['STABLE', 'WATCH', 'CRITICAL'] }, health: { type: Number }, exposure: { type: String } }
  ],
  // Alert preferences (portal)
  alertPreferences: {
    lowBalance: { type: Boolean, default: true },
    paymentReminder: { type: Boolean, default: true },
    scoreChange: { type: Boolean, default: true },
    quietHoursStart: { type: String, default: '22:00' },
    quietHoursEnd: { type: String, default: '07:00' },
  },
  // Technical Features for 6-model ML Suite
  mlFeatures: {
    // MSME Logic (M1, M2, M3)
    msme: {
      loanAmount: Number,
      term: Number,
      noEmp: Number,
      newExist: Number,
      createJob: Number,
      retainedJob: Number,
      urbanRural: Number,
      disbursementGross: Number,
      grAppv: Number,
      sbaAppv: Number,
      realEstate: Number,
      portion: Number,
      dti: Number,
      annualIncome: Number,
      revolUtil: Number,
    },
    // Retail Logic (R1, R2, R3)
    retail: {
      adjCloseHistory: [Number],
      age: Number,
      income: Number,
      creditAmount: Number,
      annuity: Number,
      goodsPrice: Number,
      childrenCount: Number,
      familyMembers: Number,
      regionRating: Number,
      cityRating: Number,
      daysBirth: Number,
      daysEmployed: Number,
      daysRegistration: Number,
      daysIdPublish: Number,
      externalSource1: Number,
      externalSource2: Number,
      externalSource3: Number,
    }
  },
  emiSchedule: [
    {
      emiId: { type: String, required: true },
      amount: { type: Number, required: true },
      originalAmount: { type: Number },
      isRestructured: { type: Boolean, default: false },
      dueDate: { type: Date, required: true },
      status: { type: String, enum: ['PAID', 'PENDING', 'OVERDUE'], default: 'PENDING' },
      description: { type: String }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

customerSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
