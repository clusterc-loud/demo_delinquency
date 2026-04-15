require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');

const Customer = require('../models/Customer');
const RiskScore = require('../models/RiskScore');
const Intervention = require('../models/Intervention');
const FraudFlag = require('../models/FraudFlag');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(4));
const pick = (arr) => arr[rand(0, arr.length - 1)];

const liveSeed = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    Customer.deleteMany({}),
    RiskScore.deleteMany({}),
    Intervention.deleteMany({}),
    FraudFlag.deleteMany({}),
  ]);

  const customers = [];

  // Generate 50 MSME Customers
  for (let i = 0; i < 50; i++) {
    customers.push({
      customerId: `VC-M-${String(i).padStart(4, '0')}`,
      customerType: 'MSME',
      name: `MSME Business ${i}`,
      businessName: `Enterprise ${i} Solutions`,
      isActive: true,
      mlFeatures: {
        msme: {
          loanAmount: rand(50000, 500000),
          term: pick([12, 24, 36, 48, 60]),
          noEmp: rand(2, 50),
          newExist: pick([1, 2]),
          createJob: rand(0, 5),
          retainedJob: rand(2, 10),
          urbanRural: pick([1, 2]),
          disbursementGross: rand(100000, 1000000),
          grAppv: rand(100000, 1000000),
          sbaAppv: rand(50000, 500000),
          realEstate: pick([0, 1]),
          portion: randFloat(0.5, 0.9),
          dti: randFloat(0.1, 0.6),
          annualIncome: rand(1000000, 5000000),
        }
      }
    });
  }

  // Generate 50 Retail Customers
  for (let i = 0; i < 50; i++) {
    customers.push({
      customerId: `VC-R-${String(i).padStart(4, '0')}`,
      customerType: 'RETAIL',
      name: `Retail Client ${i}`,
      isActive: true,
      mlFeatures: {
        retail: {
          adjCloseHistory: Array.from({ length: 10 }, () => randFloat(100, 200)),
          income: rand(200000, 1200000),
          creditAmount: rand(50000, 400000),
          annuity: rand(5000, 25000),
          goodsPrice: rand(40000, 350000),
          regionRating: pick([1, 2, 3]),
          daysBirth: -rand(8000, 24000),
          daysEmployed: -rand(365, 8000),
          externalSource1: randFloat(0.1, 0.9),
          externalSource2: randFloat(0.1, 0.9),
          externalSource3: randFloat(0.1, 0.9),
        }
      }
    });
  }

  const inserted = await Customer.insertMany(customers);
  console.log(`Inserted ${inserted.length} customers. Scoring via ML service...`);

  const riskScores = [];
  let msmeOk = 0, retailOk = 0, failed = 0;

  for (const customer of inserted) {
    try {
      let result;
      if (customer.customerType === 'MSME') {
        const f = customer.mlFeatures.msme;
        const payload = {
          annual_income: f.annualIncome,
          loan_amount: f.loanAmount,
          dti: f.dti,
          term: f.term,
          no_emp: f.noEmp,
          new_exist: f.newExist,
          create_job: f.createJob,
          retained_job: f.retainedJob,
          urban_rural: f.urbanRural,
          disbursement_gross: f.disbursementGross,
          gr_appv: f.grAppv,
          sba_appv: f.sbaAppv,
          real_estate: f.realEstate,
          portion: f.portion,
        };
        const res = await axios.post(`${ML_URL}/predict/msme`, payload);
        result = res.data;
        msmeOk++;
      } else {
        const f = customer.mlFeatures.retail;
        const payload = {
          AMT_INCOME_TOTAL: f.income,
          AMT_CREDIT: f.creditAmount,
          AMT_ANNUITY: f.annuity,
          AMT_GOODS_PRICE: f.goodsPrice,
          DAYS_BIRTH: f.daysBirth,
          DAYS_EMPLOYED: f.daysEmployed,
          EXT_SOURCE_2: f.externalSource2,
          EXT_SOURCE_3: f.externalSource3,
          REGION_POPULATION_RELATIVE: 0.02,
          adj_close_history: f.adjCloseHistory,
        };
        const res = await axios.post(`${ML_URL}/predict/retail`, payload);
        result = res.data;
        retailOk++;
      }

      const score = result.vitt_chetak_index || result.score || 50;
      const rawFraud = result.breakdown?.r3?.fraud_prob ?? result.breakdown?.safety_shield ?? 10;
      const fraudScore = Math.min(100, Math.max(0, Math.round(rawFraud <= 1 ? rawFraud * 100 : rawFraud)));
      riskScores.push({
        customerId: customer._id,
        financialHealthScore: Math.min(100, Math.max(0, Math.round(score))),
        fraudScore,
        priorityLevel: score < 40 ? 'P1' : score < 60 ? 'P2' : 'P3',
        status: score < 40 ? 'ESCALATED' : 'PENDING',
        asOfDate: new Date(),
        patternDetected: score < 50 ? 'LIQUIDITY_CRUNCH' : 'HEALTHY',
      });
    } catch (err) {
      failed++;
    }
  }

  if (riskScores.length > 0) await RiskScore.insertMany(riskScores);
  console.log(`\nDone! MSME: ${msmeOk}/50, Retail: ${retailOk}/50, Failed: ${failed}`);
  console.log(`Risk scores created: ${riskScores.length}`);
  process.exit(0);
};

liveSeed().catch(err => { console.error('Seed error:', err.message); process.exit(1); });
