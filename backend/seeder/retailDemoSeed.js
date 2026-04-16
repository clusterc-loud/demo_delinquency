const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
require('dotenv').config({ path: __dirname + '/../../.env' });
const connectDB = require('../config/db');

const seedRetail = async () => {
  await connectDB();
  console.log('Seeding dynamic retail demo customers...');

  // Clear previous
  await Customer.deleteMany({ customerId: { $in: ['RETAIL-A', 'RETAIL-B'] } });

  const now = new Date();
  
  // Base EMIs for John Doe (Struggling) - 45k per month
  const jEMIs = [
    { emiId: 'EMI-J-1', amount: 45000, dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 12), status: 'PAID', description: 'Home Loan EMI #22' },
    { emiId: 'EMI-J-2', amount: 45000, dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 12), status: 'PAID', description: 'Home Loan EMI #23' },
    { emiId: 'EMI-J-3', amount: 45000, dueDate: new Date(now.getFullYear(), now.getMonth(), 12), status: 'PENDING', description: 'Home Loan EMI #24' },
    { emiId: 'EMI-J-4', amount: 45000, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 12), status: 'PENDING', description: 'Home Loan EMI #25' },
    { emiId: 'EMI-J-5', amount: 8200, dueDate: new Date(now.getFullYear(), now.getMonth(), 15), status: 'OVERDUE', description: 'Personal Loan EMI #06' },
  ];

  // Base EMIs for Jane Smith (Healthy) - 10k per month
  const smEMIs = [
    { emiId: 'EMI-S-1', amount: 10000, dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 5), status: 'PAID', description: 'Car Loan EMI #12' },
    { emiId: 'EMI-S-2', amount: 10000, dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 5), status: 'PAID', description: 'Car Loan EMI #13' },
    { emiId: 'EMI-S-3', amount: 10000, dueDate: new Date(now.getFullYear(), now.getMonth(), 5), status: 'PENDING', description: 'Car Loan EMI #14' },
    { emiId: 'EMI-S-4', amount: 10000, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5), status: 'PENDING', description: 'Car Loan EMI #15' },
  ];

  // Customer A (At Risk)
  const customerA = await Customer.create({
    customerId: 'RETAIL-A',
    name: 'John Doe',
    email: 'john.doe.risk@example.com',
    customerType: 'RETAIL',
    password: 'password123',
    ageBracket: '26-35',
    occupationCategory: 'SALARIED',
    cityTier: 2,
    wealthSegment: 'STRUGGLING',
    emiSchedule: jEMIs,
    mlFeatures: {
      retail: {
        adjCloseHistory: [100, 95, 90, 85, 80, 75, 70, 65, 60, 50],
        age: 32,
        income: 300000,
        creditAmount: 800000,
        annuity: 53200, // 45k + 8.2k
        goodsPrice: 800000,
        daysEmployed: -300,
        externalSource2: 0.2, 
        externalSource3: 0.1,
      }
    }
  });

  await RiskScore.create({
    customerId: customerA._id,
    financialHealthScore: 42,
    priorityLevel: 'P1',
    patternDetected: 'LIQUIDITY_CRUNCH',
    status: 'PENDING',
    distressPyramidLevel: 5
  });

  // Customer B (Healthy)
  const customerB = await Customer.create({
    customerId: 'RETAIL-B',
    name: 'Jane Smith',
    email: 'jane.smith.safe@example.com',
    customerType: 'RETAIL',
    password: 'password123',
    ageBracket: '36-45',
    occupationCategory: 'SALARIED',
    cityTier: 1,
    wealthSegment: 'AFFLUENT',
    emiSchedule: smEMIs,
    mlFeatures: {
      retail: {
        adjCloseHistory: [100, 105, 108, 110, 115, 120, 122, 125, 130, 135],
        age: 40,
        income: 1500000,
        creditAmount: 200000,
        annuity: 10000,
        goodsPrice: 200000,
        daysEmployed: -3000,
        externalSource2: 0.8, 
        externalSource3: 0.75,
      }
    }
  });

  await RiskScore.create({
    customerId: customerB._id,
    financialHealthScore: 88,
    priorityLevel: 'P5',
    patternDetected: 'HEALTHY',
    status: 'PENDING',
    distressPyramidLevel: 1
  });

  console.log('Seed Dynamic Retail Demo completed.');
  process.exit();
};

seedRetail();
