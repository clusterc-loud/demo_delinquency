const express = require('express');
const router = express.Router();
const { login, register, getMe, customerLogin, customerRegister } = require('../controllers/authController');
const protect = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);

router.post('/customer/login', customerLogin);
router.post('/customer/register', customerRegister);

module.exports = router;
