const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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
                        adjCloseHistory: [100, 80, 60, 45, 30],
                        age: 32,
                        familyMembers: 4,
                        daysEmployed: -1200
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
                industrySector: 'Logistics',
                businessAgeYears: 5,
                gstNumber: '27AAAAA0000A1Z5',
                annualTurnoverBand: '₹10Cr - ₹25Cr',
                employeeCount: 45,
                mlFeatures: {
                    msme: {
                        annualIncome: 150000000,
                        loanAmount: 20000000,
                        disbursementGross: 10000000,
                        revolUtil: 0.82,
                        busAge: 5,
                        industry: 4, // Logistics code
                        dti: 0.45
                    }
                },
                supplyChainPartners: [
                    { name: 'Adani Ports', status: 'STABLE', health: 92, exposure: '₹45L' },
                    { name: 'Maersk India', status: 'WATCH', health: 58, exposure: '₹28L' },
                    { name: 'BlueDart Express', status: 'STABLE', health: 85, exposure: '₹12L' }
                ],
                emiSchedule: [
                    { emiId: 'EMI-A1', amount: 45000, dueDate: new Date(Date.now() - 30 * 24 * 3600000), status: 'OVERDUE', description: 'Working Capital Loan' },
                    { emiId: 'EMI-A2', amount: 45000, dueDate: new Date(Date.now() - 60 * 24 * 3600000), status: 'OVERDUE', description: 'Working Capital Loan' },
                    { emiId: 'EMI-A3', amount: 45000, dueDate: new Date(Date.now() - 90 * 24 * 3600000), status: 'OVERDUE', description: 'Working Capital Loan' },
                    { emiId: 'EMI-A4', amount: 45000, dueDate: new Date(), status: 'OVERDUE', description: 'Working Capital Loan' },
                    { emiId: 'EMI-A5', amount: 45000, dueDate: new Date(Date.now() + 30 * 24 * 3600000), status: 'PENDING', description: 'Working Capital Loan' }
                ]
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
                        adjCloseHistory: [100, 105, 110, 115, 120],
                        age: 28,
                        familyMembers: 1,
                        daysEmployed: -3500
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
                industrySector: 'Textiles',
                businessAgeYears: 12,
                gstNumber: '09BBBBB1111B2Z6',
                annualTurnoverBand: '₹25Cr - ₹50Cr',
                employeeCount: 120,
                mlFeatures: {
                    msme: {
                        annualIncome: 450000000,
                        loanAmount: 5000000,
                        disbursementGross: 4000000,
                        revolUtil: 0.15,
                        busAge: 12,
                        industry: 7, // Textile code
                        dti: 0.12
                    }
                },
                supplyChainPartners: [
                    { name: 'Pantaloon Retail', status: 'STABLE', health: 88, exposure: '₹1.2Cr' },
                    { name: 'Siyaram Silks', status: 'STABLE', health: 91, exposure: '₹85L' },
                    { name: 'Surat Fabrics', status: 'CRITICAL', health: 32, exposure: '₹42L' }
                ]
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
                        adjCloseHistory: [100, 95, 90, 85, 80],
                        age: 45,
                        familyMembers: 5,
                        daysEmployed: -500
                    }
                }
            }
        ];

        console.log('Seeding Customers (with password hashing)...');
        const createdCustomers = [];
        for (const cData of customers) {
            const c = new Customer(cData);
            await c.save(); 
            createdCustomers.push(c);
        }

        console.log('Seeding RiskScores...');
        const scores = [
            {
                customerId: createdCustomers[0]._id,
                financialHealthScore: 28,
                priorityLevel: 'P1',
                status: 'PENDING',
                patternDetected: 'EXPENSE_SHOCK',
                interventionRecommended: 'EMI_RESTRUCTURE',
                dimensionScores: { 'Cash Flow': 28, 'Debt Servicing': 45, 'Market Risk': 55 },
                asOfDate: new Date()
            },
            {
                customerId: createdCustomers[1]._id,
                financialHealthScore: 22,
                priorityLevel: 'P1',
                status: 'PENDING',
                patternDetected: 'EXPENSE_SHOCK',
                interventionRecommended: 'EMI_RESTRUCTURE',
                dimensionScores: { 'Capital Velocity': 15, 'Ecosystem Risk': 22, 'Operational continuity': 31 },
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
                fraudScore: 12,
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
                    { sender: 'CUSTOMER', text: 'Our supply chain is disrupted due to a major supplier default. We need an urgent working capital extension.', timestamp: new Date(Date.now() - 7200000), unreadByAdmin: true }
                ]
            }
        ];
        await Chat.insertMany(initialChats);

        console.log('Master Seed Complete! MSME personas hardened.');
        process.exit();
    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
};

seedData();
