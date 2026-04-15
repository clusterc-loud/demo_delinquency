const express = require('express');
const router = express.Router();
const {
  getCustomerProfile,
  getInterventionHistory,
  getNetworkRisk,
  rescoreCustomer,
} = require('../controllers/customerController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/:customerId/profile', getCustomerProfile);
router.get('/:customerId/intervention-history', getInterventionHistory);
router.get('/:customerId/network-risk', getNetworkRisk);
router.post('/:customerId/rescore', rescoreCustomer);

module.exports = router;
