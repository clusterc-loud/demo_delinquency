require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const Chat = require('../models/Chat');
const User = require('../models/User');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Clearing existing data...');
        
        await Customer.deleteMany({});
        await RiskScore.deleteMany({});
        await Intervention.deleteMany({});
        await Chat.deleteMany({});
        await User.deleteMany({});

        console.log('Seeding Analyst User...');
        const analyst = new User({
            name: 'Priya Sharma',
            email: 'analyst@vittchetak.com',
            password: 'password123',
            role: 'analyst',
            employeeId: 'EMP-001'
        });
        await analyst.save();

        const customers = [
            {
                customerId: 'RETAIL-001',
                name: 'John Doe',
                email: 'john.doe.risk@example.com',
                password: 'password123',
                customerType: 'RETAIL',
                mlFeatures: {
                    retail: {
                        income: 45000,
                        creditAmount: 150000,
                        annuity: 8000,
                        externalSource2: 0.32,
                        adjCloseHistory: [100, 80, 60, 45, 30]
                    }
                },
                emiSchedule: [
                    { emiId: 'EMI-J1', amount: 8000, dueDate: new Date(), status: 'OVERDUE', description: 'Personal Loan' }
                ]
            },
            {
                customerId: 'MSME-002',
                businessName: 'Global Logistics Pvt Ltd',
                name: 'Anil Kumar',
                email: 'anil.logistics@example.com',
                password: 'password123',
                customerType: 'MSME',
                gstNumber: '27AAAAA0000A1Z5',
                mlFeatures: {
                    msme: {
                        annualIncome: 4500000,
                        loanAmount: 2000000,
                        disbursementGross: 1000000,
                        revolUtil: 0.85
                    }
                }
            },
            {
                customerId: 'RETAIL-003',
                name: 'Priya Sharma',
                email: 'priya.sharma@example.com',
                password: 'password123',
                customerType: 'RETAIL',
                mlFeatures: {
                    retail: {
                        income: 95000,
                        creditAmount: 50000,
                        annuity: 2000,
                        externalSource2: 0.88,
                        adjCloseHistory: [100, 105, 110, 115, 120]
                    }
                }
            },
            {
                customerId: 'MSME-004',
                businessName: 'Hindustan Exports',
                name: 'Vikram Singh',
                email: 'vikram.exports@example.com',
                password: 'password123',
                customerType: 'MSME',
                gstNumber: '09BBBBB1111B2Z6',
                mlFeatures: {
                    msme: {
                        annualIncome: 8000000,
                        loanAmount: 500000,
                        disbursementGross: 400000,
                        revolUtil: 0.15
                    }
                }
            },
            {
                customerId: 'RETAIL-005',
                name: 'Aarav Gupta',
                email: 'aarav.gupta@example.com',
                password: 'password123',
                customerType: 'RETAIL',
                mlFeatures: {
                    retail: {
                        income: 60000,
                        creditAmount: 800000,
                        annuity: 15000,
                        externalSource2: 0.45,
                        adjCloseHistory: [100, 95, 90, 85, 80]
                    }
                }
            }
        ];

        console.log('Seeding Customers (with password hashing)...');
        const createdCustomers = [];
        for (const cData of customers) {
            const c = new Customer(cData);
            await c.save(); // This triggers the pre('save') hook
            createdCustomers.push(c);
        }

        console.log('Seeding RiskScores...');
        const scores = [
            {
                customerId: createdCustomers[0]._id,
                financialHealthScore: 28,
                priorityLevel: 'P1',
                status: 'PENDING',
                patternDetected: 'LIQUIDITY_CRUNCH',
                dimensionScores: { liquidityIndex: 28, debtBurden: 85, networkRisk: 10 },
                asOfDate: new Date()
            },
            {
                customerId: createdCustomers[1]._id,
                financialHealthScore: 34,
                priorityLevel: 'P1',
                status: 'PENDING',
                patternDetected: 'INCOME_DISRUPTION',
                dimensionScores: { liquidityIndex: 30, debtBurden: 70, networkRisk: 65 },
                asOfDate: new Date()
            },
            {
                customerId: createdCustomers[2]._id,
                financialHealthScore: 82,
                priorityLevel: 'P5',
                status: 'RESOLVED',
                patternDetected: 'HEALTHY',
                asOfDate: new Date()
            },
            {
                customerId: createdCustomers[3]._id,
                financialHealthScore: 75,
                priorityLevel: 'P4',
                status: 'RESOLVED',
                patternDetected: 'HEALTHY',
                fraudScore: 82,
                asOfDate: new Date()
            },
            {
                customerId: createdCustomers[4]._id,
                financialHealthScore: 52,
                priorityLevel: 'P3',
                status: 'PENDING',
                patternDetected: 'DEBT_SPIRAL',
                asOfDate: new Date()
            }
        ];
        await RiskScore.insertMany(scores);

        console.log('Seeding Initial Chats...');
        const initialChats = [
            {
                customerId: 'RETAIL-001',
                messages: [
                    { sender: 'CUSTOMER', text: 'I missed my last EMI because of a medical emergency. Can you help?', timestamp: new Date(Date.now() - 3600000), unreadByAdmin: true },
                    { sender: 'SYSTEM', text: 'AI Risk Monitor: Financial Stress Detected. Analyst notified.', timestamp: new Date(Date.now() - 3500000), unreadByAdmin: false }
                ]
            },
            {
                customerId: 'MSME-002',
                messages: [
                    { sender: 'CUSTOMER', text: 'Our supply chain is disrupted. We need an urgent working capital extension.', timestamp: new Date(Date.now() - 7200000) }
                ]
            }
        ];
        await Chat.insertMany(initialChats);

        console.log('Master Seed Complete! 5 Curated Personas and 1 Admin User created.');
        process.exit();
    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
};

seedData();
