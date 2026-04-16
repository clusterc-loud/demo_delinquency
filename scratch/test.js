const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const RiskScore = require('./backend/models/RiskScore');
const Customer = require('./backend/models/Customer');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const scores = await RiskScore.find({ status: 'PENDING' }).populate('customerId');
    console.log("Pending scores:", scores.map(s => ({ name: s.customerId.name, status: s.status, id: s.customerId.customerId })));
    process.exit(0);
});
