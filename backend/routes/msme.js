const express = require('express');
const router = express.Router();
const { getMSMEGraph, getContagionPath } = require('../controllers/msmeController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/graph', getMSMEGraph);
router.get('/contagion-path/:msmeId', getContagionPath);

module.exports = router;
