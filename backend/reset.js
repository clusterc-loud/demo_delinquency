require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const RiskScore = require('./models/RiskScore');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
   await require('./models/Chat').deleteMany({});
   await require('./models/Intervention').deleteMany({});
   
   const customers = await Customer.find({ customerType: 'RETAIL' });
   for (let c of customers) {
       c.emiSchedule = [
        { emiId: `EMI-1-${Date.now()}`, amount: 15400, dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'PAID', description: 'Personal Loan #01' },
        { emiId: `EMI-2-${Date.now()}`, amount: 15400, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: 'PENDING', description: 'Personal Loan #02' },
        { emiId: `EMI-3-${Date.now()}`, amount: 8200, dueDate: new Date(Date.now() -   2 * 24 * 60 * 60 * 1000), status: 'OVERDUE', description: 'Credit Card Minimum' },
       ];
       if (c.mlFeatures && c.mlFeatures.retail) {
           c.mlFeatures.retail.creditAmount = 200000;
           c.mlFeatures.retail.adjCloseHistory = [100, 95, 90, 85, 80];
           c.mlFeatures.retail.annuity = 23600;
       }
       await c.save();
       
       const rs = await RiskScore.findOne({ customerId: c._id }).sort({ asOfDate: -1 });
       if (rs) {
           rs.financialHealthScore = 42;
           rs.priorityLevel = 'P1';
           rs.patternDetected = 'LIQUIDITY_CRUNCH';
           await rs.save();
       }
   }
   console.log('Reset complete! All retail users are back to default risk states.');
   process.exit();
}).catch(err => {
   console.error(err);
   process.exit(1);
});
