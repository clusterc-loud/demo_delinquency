const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');

// POST /api/simulator/retail-transaction
router.post('/retail-transaction', simulatorController.simulateRetailTransaction);

// POST /api/simulator/msme-transaction
router.post('/msme-transaction', simulatorController.simulateMSMETransaction);

module.exports = router;
