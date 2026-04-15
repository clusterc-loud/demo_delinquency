const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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
      employeeId: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
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

    const customerId = `VC-${customerType === 'MSME' ? 'MSME' : 'RET'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const customer = await Customer.create({
      customerId,
      email: email.toLowerCase().trim(),
      password: password || 'securepass1',
      name,
      customerType,
      businessName: customerType === 'MSME' ? businessName || `${name} Enterprises` : undefined,
      gstNumber: customerType === 'MSME' ? gstNumber || '27XXXXX0000X1Z5' : undefined,
      isActive: true,
    });
    
    // Seed an initial RiskScore so the portal displays immediately
    const RiskScore = require('../models/RiskScore');
    await RiskScore.create({
      customerId: customer._id,
      asOfDate: new Date(),
      financialHealthScore: Math.floor(65 + Math.random() * 25), // reasonable starting score 65-90
      priorityLevel: 'P3',
      dimensionScores: {
        liquidityIndex: Math.floor(60 + Math.random() * 30),
        incomeStability: Math.floor(60 + Math.random() * 30),
        portfolioHealth: Math.floor(60 + Math.random() * 30),
        debtBurden: Math.floor(20 + Math.random() * 40),
        behavioralSignals: Math.floor(70 + Math.random() * 20),
        networkRisk: Math.floor(20 + Math.random() * 40)
      }
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
