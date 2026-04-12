const express = require('express');
const router = express.Router();
const {
  getQueue,
  generateMessage,
  approveIntervention,
  routeToRM,
} = require('../controllers/interventionController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/queue', getQueue);
router.get('/:customerId/generate-message', generateMessage);
router.post('/:customerId/approve', approveIntervention);
router.post('/:customerId/route-to-rm', routeToRM);

module.exports = router;
