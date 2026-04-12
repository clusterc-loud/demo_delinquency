const express = require('express');
const router = express.Router();
const { getFlaggedAccounts, getFlaggedPreview } = require('../controllers/flaggedAccountsController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', getFlaggedAccounts);
router.get('/:customerId/preview', getFlaggedPreview);

module.exports = router;
