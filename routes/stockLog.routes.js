const express = require('express');
const router = express.Router();

const {
  getAllStockLog,
  updateStockLogStatus,
  endSession,
} = require('../controllers/stockLog.controller.js');

router.get('/', getAllStockLog);
router.put('/:id', updateStockLogStatus);
router.post('/end-session', endSession);

module.exports = router;
