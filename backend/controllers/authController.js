const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const mlClient = require('../utils/mlClient');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { employeeId: email.trim() }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, name, role, employeeId, fullName, branch } = req.body;

    const resolvedName = fullName || name;
    if (!email || !resolvedName) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: password || 'password123',
      name: resolvedName,
      role: role || 'analyst',
      employeeId: employeeId || `EMP-${Date.now() % 10000}`,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/customer/login
const customerLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const Customer = require('../models/Customer');
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    
    if (!customer || !customer.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(customer._id);
    res.json({
      token,
      user: {
        id: customer._id,
        customerId: customer.customerId,
        email: customer.email,
        name: customer.name,
        role: 'customer',
        type: customer.customerType,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/customer/register
const customerRegister = async (req, res, next) => {
  try {
    const { email, password, name, customerType, businessName, gstNumber } = req.body;
    if (!email || !name || !customerType) return res.status(400).json({ message: 'Name, email, and customer type are required' });

    const Customer = require('../models/Customer');
    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const customerId = `VC-${customerType === 'MSME' ? 'MSME' : 'RET'}-${Date.now() % 100000}`;

    const customer = await Customer.create({
      customerId,
      email: email.toLowerCase().trim(),
      password: password || 'securepass1',
      name,
      customerType,
      businessName: customerType === 'MSME' ? businessName || `${name} Enterprises` : undefined,
      gstNumber: customerType === 'MSME' ? gstNumber || '27XXXXX0000X1Z5' : undefined,
      isActive: true,
      emiSchedule: [
        { emiId: `EMI-1-${Date.now()}`, amount: 15400, dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'PAID', description: 'Personal Loan #01' },
        { emiId: `EMI-2-${Date.now()}`, amount: 15400, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: 'PENDING', description: 'Personal Loan #02' },
        { emiId: `EMI-3-${Date.now()}`, amount: 8200, dueDate: new Date(Date.now() -   2 * 24 * 60 * 60 * 1000), status: 'OVERDUE', description: 'Credit Card Minimum' },
      ],
      mlFeatures: {
        retail: {
          adjCloseHistory: [100, 95, 90, 85, 80],
          income: 50000,
          creditAmount: 200000,
          annuity: 23600
        }
      }
    });
    
    // Seed an initial RiskScore so the portal displays immediately using full ML precision
    const RiskScore = require('../models/RiskScore');
    let startingScore = 75;
    let dims = { liquidityIndex: 70, incomeStability: 70, portfolioHealth: 70, debtBurden: 30, behavioralSignals: 80, networkRisk: 25 };

    try {
      if (customerType === 'MSME') {
        const payload = { loan_amount: 150000, annual_income: 600000, dti: 0.3, revol_util: 0.3, int_rate: 0.12, term: 36, no_emp: 5 };
        const mlRes = await mlClient.predictMSME(payload);
        startingScore = mlRes.vitt_chetak_index;
        dims.liquidityIndex = mlRes.breakdown.credit_health;
        dims.debtBurden = mlRes.breakdown.growth_potential;
      } else {
        const payload = { customer_id: customerId, AMT_INCOME_TOTAL: 65000, AMT_CREDIT: 120000, AMT_ANNUITY: 5000, DAYS_BIRTH: -10000, DAYS_EMPLOYED: -2000 };
        const mlRes = await mlClient.predictRetail(payload);
        startingScore = mlRes.score;
        dims.liquidityIndex = 100 - ((mlRes.breakdown.r2?.liquidity_stress || 0.2) * 100);
      }
    } catch (e) {
      console.log('ML seed failed during registration, using base 75 score.');
    }

    await RiskScore.create({
      customerId: customer._id,
      asOfDate: new Date(),
      financialHealthScore: startingScore,
      priorityLevel: startingScore > 60 ? 'P4' : 'P3',
      dimensionScores: dims
    });

    const token = generateToken(customer._id);
    res.status(201).json({
      token,
      user: {
        id: customer._id,
        customerId: customer.customerId,
        email: customer.email,
        name: customer.name,
        role: 'customer',
        type: customer.customerType,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, getMe, customerLogin, customerRegister };
