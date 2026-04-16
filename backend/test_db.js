require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
   const a = await Customer.findOne({email: 'john.doe.risk@example.com'});
   console.log('user:', a ? a.email : 'null');
   if (a) {
       const match = await a.comparePassword('password123');
       console.log('password match:', match);
   }
   process.exit();
});
