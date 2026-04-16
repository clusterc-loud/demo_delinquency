const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');

// POST /api/simulator/retail-transaction
router.post('/retail-transaction', simulatorController.simulateRetailTransaction);

module.exports = router;
