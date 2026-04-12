require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../server/models/User');
const Customer = require('../server/models/Customer');
const RiskScore = require('../server/models/RiskScore');
const Intervention = require('../server/models/Intervention');
const FraudFlag = require('../server/models/FraudFlag');

// ─── Utility helpers ──────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const pick = (arr) => arr[rand(0, arr.length - 1)];
const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

// ─── Static data lists ────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Shivam', 'Atharv', 'Advik', 'Pranav', 'Advaith',
  'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Siddharth', 'Priya', 'Ananya',
  'Diya', 'Saanvi', 'Anika', 'Riya', 'Aadhya', 'Shreya', 'Avni', 'Tanvi',
  'Nisha', 'Pooja', 'Kavya', 'Mehak', 'Simran', 'Anjali', 'Deepika', 'Neha',
  'Swati', 'Divya', 'Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Ganesh',
  'Vikram', 'Amit', 'Rohit', 'Sandeep', 'Vinod',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Mehta',
  'Mishra', 'Nair', 'Reddy', 'Shah', 'Pillai', 'Rao', 'Iyer', 'Menon',
  'Chawla', 'Bhat', 'Kaur', 'Malhotra',
];

const INDUSTRIES = [
  'Textile', 'Food Processing', 'Auto Parts', 'Pharma', 'IT Services',
  'Construction', 'Agriculture', 'Retail Trade', 'Healthcare', 'Education',
];

const BUSINESS_SUFFIXES = ['Pvt Ltd', 'Enterprises', 'Co', 'Industries', 'Solutions', 'Works'];

const OCCUPATIONS = [
  'Salaried Professional', 'Self Employed', 'Business Owner',
  'Freelancer', 'Government Employee', 'Retired', 'Agriculture',
];

const RETAIL_PATTERNS = [
  'LIQUIDITY_CRUNCH', 'EXPENSE_SHOCK', 'INCOME_DISRUPTION',
  'DEBT_SPIRAL', 'SAVINGS_DEPLETION', 'HEALTHY', 'SEASONAL_STRESS',
];

const MSME_PATTERNS = [
  'WORKING_CAPITAL_CRUNCH', 'DEMAND_COLLAPSE', 'INPUT_COST_SHOCK',
  'CUSTOMER_CONCENTRATION', 'SEASONAL_STRESS', 'GROWTH_PAINS',
  'HEALTHY', 'LIQUIDITY_CRUNCH',
];

const INTERVENTION_TYPES = [
  'PAYMENT_HOLIDAY', 'EMI_RESTRUCTURE', 'DEBT_CONSOLIDATION',
  'WORKING_CAPITAL_LOAN', 'INVOICE_DISCOUNTING', 'BUSINESS_ADVISORY',
  'COUNSELLOR_REFERRAL', 'CREDIT_LIMIT_ADJUSTMENT',
];

const PATTERN_TO_INTERVENTION = {
  LIQUIDITY_CRUNCH: 'PAYMENT_HOLIDAY',
  EXPENSE_SHOCK: 'EMI_RESTRUCTURE',
  INCOME_DISRUPTION: 'EMI_RESTRUCTURE',
  DEBT_SPIRAL: 'DEBT_CONSOLIDATION',
  SAVINGS_DEPLETION: 'CREDIT_LIMIT_ADJUSTMENT',
  WORKING_CAPITAL_CRUNCH: 'WORKING_CAPITAL_LOAN',
  DEMAND_COLLAPSE: 'BUSINESS_ADVISORY',
  INPUT_COST_SHOCK: 'INVOICE_DISCOUNTING',
  CUSTOMER_CONCENTRATION: 'BUSINESS_ADVISORY',
  SEASONAL_STRESS: 'WORKING_CAPITAL_LOAN',
  GROWTH_PAINS: 'WORKING_CAPITAL_LOAN',
  HEALTHY: 'CREDIT_LIMIT_ADJUSTMENT',
};

const WEALTH_SEGMENT_SCORE_RANGES = {
  AFFLUENT: [65, 95],
  MIDDLE: [45, 80],
  LOWER_MIDDLE: [25, 65],
  STRUGGLING: [5, 40],
};

// ─── Score / priority helpers ─────────────────────────────────────────────────
const scoreToPriority = (score) => {
  if (score >= 80) return 'P5';
  if (score >= 60) return 'P4';
  if (score >= 40) return 'P3';
  if (score >= 20) return 'P2';
  return 'P1';
};

const scoreToDistressLevel = (score) => {
  if (score >= 75) return 1;
  if (score >= 50) return 3;
  if (score >= 25) return 6;
  return 8;
};

// ─── Generate SHAP signals ────────────────────────────────────────────────────
const generateRetailShap = (score) => [
  { signalName: 'Days Past Due (30+)', currentValue: `${rand(0, 90)} days`, normalRange: '0 days', impactPercent: randFloat(0.3, 0.9) },
  { signalName: 'EMI-to-Income Ratio', currentValue: `${rand(30, 80)}%`, normalRange: '<40%', impactPercent: randFloat(0.2, 0.8) },
  { signalName: 'Digital Spend Pattern', currentValue: `${rand(5, 60)}% drop`, normalRange: 'Stable', impactPercent: randFloat(0.1, 0.6) },
  { signalName: 'Salary Regularity Score', currentValue: `${rand(30, 95)}/100`, normalRange: '>80', impactPercent: randFloat(0.2, 0.7) },
  { signalName: 'Savings Depletion Rate', currentValue: `${rand(5, 40)}%/month`, normalRange: '<5%', impactPercent: randFloat(0.1, 0.5) },
  { signalName: 'Credit Utilization', currentValue: `${rand(40, 95)}%`, normalRange: '<30%', impactPercent: randFloat(0.2, 0.75) },
  { signalName: 'ATM Withdrawal Frequency', currentValue: `${rand(8, 25)}x/month`, normalRange: '<8x', impactPercent: randFloat(0.05, 0.4) },
  { signalName: 'Loan Inquiry Count', currentValue: `${rand(0, 6)} in 90 days`, normalRange: '0-1', impactPercent: randFloat(0.1, 0.5) },
];

const generateMSMEShap = (score) => [
  { signalName: 'GST Filing Gap', currentValue: `${rand(0, 4)} missed quarters`, normalRange: '0', impactPercent: randFloat(0.3, 0.9) },
  { signalName: 'Working Capital Ratio', currentValue: `${randFloat(0.5, 1.8)}x`, normalRange: '>1.5x', impactPercent: randFloat(0.3, 0.85) },
  { signalName: 'Supplier Payment Delay', currentValue: `${rand(5, 60)} days avg`, normalRange: '<15 days', impactPercent: randFloat(0.2, 0.75) },
  { signalName: 'Buyer Concentration Risk', currentValue: `${rand(40, 90)}% single buyer`, normalRange: '<30%', impactPercent: randFloat(0.2, 0.8) },
  { signalName: 'Receivables Aging 90+', currentValue: `${rand(0, 50)}% of AR`, normalRange: '<10%', impactPercent: randFloat(0.15, 0.65) },
  { signalName: 'Cash Burn Rate', currentValue: `₹${rand(2, 30)}L/month`, normalRange: '<₹10L', impactPercent: randFloat(0.1, 0.6) },
  { signalName: 'Current Account Balance', currentValue: `₹${rand(1, 20)}L`, normalRange: '>₹25L', impactPercent: randFloat(0.2, 0.7) },
  { signalName: 'Employee Salary Delays', currentValue: `${rand(0, 3)} incidents`, normalRange: '0', impactPercent: randFloat(0.05, 0.5) },
];

// ─── Generate survival probabilities ─────────────────────────────────────────
const generateSurvivalProbs = (baseScore) => {
  let base = clamp(baseScore / 100 + randFloat(-0.05, 0.05), 0.1, 0.99);
  const probs = {};
  for (let i = 1; i <= 12; i++) {
    probs[`week${i}`] = parseFloat(base.toFixed(3));
    base = clamp(base - randFloat(0.01, 0.05), 0.05, 0.99);
  }
  return probs;
};

// ─── Generate dimension scores ────────────────────────────────────────────────
const generateDimensions = (baseScore) => ({
  liquidityIndex: clamp(baseScore + rand(-20, 20)),
  incomeStability: clamp(baseScore + rand(-15, 15)),
  debtBurden: clamp(baseScore + rand(-25, 25)),
  portfolioHealth: clamp(baseScore + rand(-20, 20)),
  behavioralSignals: clamp(baseScore + rand(-20, 20)),
  networkRisk: clamp(baseScore + rand(-30, 30)),
});

// ─── Weighted random wealth segment ──────────────────────────────────────────
const randomWealthSegment = () => {
  const r = Math.random();
  if (r < 0.15) return 'AFFLUENT';
  if (r < 0.55) return 'MIDDLE';
  if (r < 0.85) return 'LOWER_MIDDLE';
  return 'STRUGGLING';
};

// ─── Generate circular flow data for fraud ───────────────────────────────────
const generateCircularFlow = (customerName) => {
  const shells = [
    `Shell Co Alpha ${rand(100, 999)}`,
    `Phantom Ventures ${rand(100, 999)}`,
    `Ghost Imports Pvt ${rand(100, 999)}`,
  ];
  return Array.from({ length: rand(3, 5) }, (_, i) => ({
    from: i === 0 ? customerName : shells[(i - 1) % shells.length],
    to: shells[i % shells.length],
    amount: rand(200000, 5000000),
    date: new Date(Date.now() - rand(1, 180) * 24 * 60 * 60 * 1000),
  }));
};

// ─── Generate net worth trend for fraud ──────────────────────────────────────
const generateNetWorthTrend = (baseScore) => {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  let netWorth = rand(2000000, 10000000);
  return months.map((month, i) => {
    netWorth += rand(100000, 500000); // rising net worth
    const healthScore = clamp(baseScore - i * rand(3, 8)); // declining health
    return { month, netWorth, healthScore };
  });
};

// ─── Main seeder ─────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    RiskScore.deleteMany({}),
    Intervention.deleteMany({}),
    FraudFlag.deleteMany({}),
  ]);

  // ── USERS ──
  console.log('Seeding users...');
  const usersRaw = [
    { email: 'analyst@vittchetak.com', password: 'password123', name: 'Priya Sharma', role: 'analyst', employeeId: 'EMP-0001' },
    { email: 'admin@vittchetak.com', password: 'password123', name: 'Rahul Mehta', role: 'admin', employeeId: 'EMP-0002' },
    { email: 'rm@vittchetak.com', password: 'password123', name: 'Arjun Nair', role: 'rm', employeeId: 'EMP-0003' },
  ];

  const hashedUsers = await Promise.all(
    usersRaw.map(async (u) => ({
      ...u,
      password: await bcrypt.hash(u.password, 10),
    }))
  );
  await User.insertMany(hashedUsers);
  console.log('✅ 3 users created');

  // ── RETAIL CUSTOMERS (300) ──
  console.log('Seeding retail customers...');
  const retailCustomers = [];
  for (let i = 0; i < 300; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const wealthSegment = randomWealthSegment();
    retailCustomers.push({
      customerId: `VC-R${String(100000 + i).padStart(6, '0')}`,
      customerType: 'RETAIL',
      name: `${firstName} ${lastName}`,
      ageBracket: pick(['18-25', '26-35', '36-45', '46-55', '55+']),
      occupationCategory: pick(OCCUPATIONS),
      cityTier: pick([1, 1, 2, 2, 3]),
      wealthSegment,
      maritalStatusInferred: pick(['SINGLE', 'MARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED']),
      isActive: true,
    });
  }
  const insertedRetail = await Customer.insertMany(retailCustomers);
  console.log('✅ 300 retail customers created');

  // ── MSME CUSTOMERS (150) ──
  console.log('Seeding MSME customers...');
  const msmeCustomers = [];
  for (let i = 0; i < 150; i++) {
    const ownerName = pick(LAST_NAMES);
    const industry = pick(INDUSTRIES);
    const suffix = pick(BUSINESS_SUFFIXES);
    const businessName = `${ownerName} ${industry} ${suffix}`;
    const wealthSegment = randomWealthSegment();
    const gstState = '27';
    const gstBody = `${pick(LAST_NAMES).toUpperCase().slice(0, 5)}${rand(1000, 9999)}`;
    const gstNumber = `${gstState}${gstBody}0000X1ZX`;

    msmeCustomers.push({
      customerId: `VC-M${String(100000 + i).padStart(6, '0')}`,
      customerType: 'MSME',
      name: `${pick(FIRST_NAMES)} ${ownerName}`,
      ageBracket: pick(['26-35', '36-45', '46-55', '55+']),
      cityTier: pick([1, 2, 2, 3]),
      wealthSegment,
      maritalStatusInferred: pick(['MARRIED', 'MARRIED', 'SINGLE', 'DIVORCED']),
      isActive: true,
      businessName,
      industrySector: industry,
      businessAgeYears: rand(1, 25),
      gstNumber,
      annualTurnoverBand: pick(['<50L', '50L-2Cr', '2Cr-10Cr', '10Cr-50Cr', '>50Cr']),
      employeeCount: rand(2, 500),
    });
  }
  const insertedMSME = await Customer.insertMany(msmeCustomers);
  console.log('✅ 150 MSME customers created');

  const allCustomers = [...insertedRetail, ...insertedMSME];

  // ── RISK SCORES (6 per customer = 2700) ──
  console.log('Seeding risk scores...');
  const allRiskScores = [];
  const statusWeights = ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'INTERVENED', 'INTERVENED', 'RESOLVED'];

  for (const customer of allCustomers) {
    const [scoreMin, scoreMax] = WEALTH_SEGMENT_SCORE_RANGES[customer.wealthSegment] || [30, 70];
    const currentScore = rand(scoreMin, scoreMax);
    const patterns = customer.customerType === 'RETAIL' ? RETAIL_PATTERNS : MSME_PATTERNS;
    const pattern = pick(patterns);
    const interventionType = PATTERN_TO_INTERVENTION[pattern] || 'BUSINESS_ADVISORY';

    // Current score
    allRiskScores.push({
      customerId: customer._id,
      asOfDate: new Date(),
      financialHealthScore: currentScore,
      priorityLevel: scoreToPriority(currentScore),
      patternDetected: pattern,
      patternConfidence: randFloat(0.55, 0.97),
      fraudScore: Math.random() < 0.05 ? rand(55, 95) : rand(0, 30),
      survivalProbabilities: generateSurvivalProbs(currentScore),
      dimensionScores: generateDimensions(currentScore),
      shapSignals: customer.customerType === 'RETAIL'
        ? generateRetailShap(currentScore)
        : generateMSMEShap(currentScore),
      interventionRecommended: interventionType,
      slaDeadline: new Date(Date.now() + rand(1, 72) * 60 * 60 * 1000),
      status: pick(statusWeights),
      distressPyramidLevel: scoreToDistressLevel(currentScore),
    });

    // 5 historical scores (one per month)
    for (let m = 1; m <= 5; m++) {
      const histScore = clamp(currentScore + rand(-15, 15));
      const histDate = new Date();
      histDate.setMonth(histDate.getMonth() - m);
      allRiskScores.push({
        customerId: customer._id,
        asOfDate: histDate,
        financialHealthScore: histScore,
        priorityLevel: scoreToPriority(histScore),
        patternDetected: pick(patterns),
        patternConfidence: randFloat(0.50, 0.95),
        fraudScore: rand(0, 25),
        survivalProbabilities: generateSurvivalProbs(histScore),
        dimensionScores: generateDimensions(histScore),
        shapSignals: customer.customerType === 'RETAIL'
          ? generateRetailShap(histScore)
          : generateMSMEShap(histScore),
        interventionRecommended: PATTERN_TO_INTERVENTION[pick(patterns)] || 'BUSINESS_ADVISORY',
        slaDeadline: new Date(histDate.getTime() + rand(1, 72) * 60 * 60 * 1000),
        status: 'ARCHIVED',
        distressPyramidLevel: scoreToDistressLevel(histScore),
      });
    }
  }

  // Insert in batches to avoid memory issues
  const BATCH_SIZE = 500;
  for (let i = 0; i < allRiskScores.length; i += BATCH_SIZE) {
    await RiskScore.insertMany(allRiskScores.slice(i, i + BATCH_SIZE));
  }
  console.log(`✅ ${allRiskScores.length} risk scores created`);

  // ── INTERVENTIONS (40% of flagged customers) ──
  console.log('Seeding interventions...');

  // Get current (non-archived) risk scores
  const currentRiskScores = await RiskScore.find({ status: { $ne: 'ARCHIVED' } }).populate('customerId');
  const flaggedForIntervention = currentRiskScores.filter(() => Math.random() < 0.4);

  const MESSAGE_PREVIEWS = {
    PAYMENT_HOLIDAY: 'We offer you a 30-day payment holiday — no credit score impact.',
    EMI_RESTRUCTURE: 'Reduce your EMI by up to 30% with our restructuring plan.',
    DEBT_CONSOLIDATION: 'Combine all your loans into one simple monthly payment.',
    WORKING_CAPITAL_LOAN: 'Pre-approved working capital loan of up to ₹10L — 2 hour approval.',
    INVOICE_DISCOUNTING: 'Improve cash cycle by 45 days with our invoice discounting facility.',
    BUSINESS_ADVISORY: 'Free consultation with our MSME specialist available now.',
    COUNSELLOR_REFERRAL: 'Our financial counsellor will contact you within 1 hour.',
    CREDIT_LIMIT_ADJUSTMENT: 'We\'ve pre-approved an enhanced credit limit for your account.',
  };

  const interventionDocs = flaggedForIntervention.map((rs) => ({
    customerId: rs.customerId._id,
    riskScoreId: rs._id,
    timestamp: new Date(Date.now() - rand(0, 30) * 24 * 60 * 60 * 1000),
    interventionType: rs.interventionRecommended || pick(INTERVENTION_TYPES),
    channel: pick(['SMS', 'EMAIL', 'APP', 'RM_CALL']),
    messagePreview: MESSAGE_PREVIEWS[rs.interventionRecommended] || MESSAGE_PREVIEWS['BUSINESS_ADVISORY'],
    approvedBy: 'EMP-0001',
    customerResponse: pick(['ACCEPTED', 'ACCEPTED', 'DECLINED', 'NO_RESPONSE', 'PENDING']),
    outcome30d: pick(['RECOVERED', 'RECOVERED', 'STILL_AT_RISK', 'DEFAULTED', 'PENDING']),
    confidenceScore: randFloat(0.65, 0.95),
  }));

  for (let i = 0; i < interventionDocs.length; i += BATCH_SIZE) {
    await Intervention.insertMany(interventionDocs.slice(i, i + BATCH_SIZE));
  }
  console.log(`✅ ${interventionDocs.length} interventions created`);

  // ── FRAUD FLAGS (5% of customers) ──
  console.log('Seeding fraud flags...');
  const fraudCandidates = allCustomers.filter(() => Math.random() < 0.05);

  const fraudFlagDocs = fraudCandidates.map((customer) => {
    const fraudScore = rand(55, 95);
    const displayName = customer.customerType === 'MSME'
      ? (customer.businessName || customer.name)
      : customer.name;

    // Randomly trigger 2-4 indicators
    const allIndicators = [
      'circularMoneyFlow', 'unverifiedMerchants', 'patternTooRegular',
      'netWorthDivergence', 'lifestyleVsDistress', 'multipleNewAccounts',
      'agentInteractionAvoidance',
    ];
    const shuffled = allIndicators.sort(() => Math.random() - 0.5);
    const numActive = rand(2, 4);
    const activeSet = new Set(shuffled.slice(0, numActive));

    const indicatorsTriggered = {};
    const signalBreakdown = {};
    allIndicators.forEach((ind) => {
      indicatorsTriggered[ind] = activeSet.has(ind);
      signalBreakdown[ind] = activeSet.has(ind) ? rand(15, 50) : rand(0, 8);
    });

    return {
      customerId: customer._id,
      fraudScore,
      indicatorsTriggered,
      signalBreakdown,
      circularFlowData: generateCircularFlow(displayName),
      netWorthTrend: generateNetWorthTrend(rand(20, 50)),
      status: pick(['REVIEW', 'REVIEW', 'SUSPICIOUS', 'ESCALATED']),
    };
  });

  if (fraudFlagDocs.length > 0) {
    await FraudFlag.insertMany(fraudFlagDocs);
  }
  console.log(`✅ ${fraudFlagDocs.length} fraud flags created`);

  console.log('');
  console.log('🎉 Seeding complete! VittChetak database is ready.');
  console.log('');
  console.log('Test credentials:');
  console.log('  analyst@vittchetak.com  /  password123');
  console.log('  admin@vittchetak.com    /  password123');
  console.log('  rm@vittchetak.com       /  password123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
