const express = require('express');
const router = express.Router();

const {
  getAllStockLog,
  updateStockLogStatus,
  endSession,
  autoApproveEligibleLogs,
} = require('../controllers/stockLog.controller.js');

router.get('/', getAllStockLog);
router.put('/:id', updateStockLogStatus);
router.post('/end-session', endSession);
router.post('/auto-approve', autoApproveEligibleLogs);

module.exports = router;
