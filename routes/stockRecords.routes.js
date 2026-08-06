// const express = require('express');
// const router = express.Router();
// const {
//   getAllStockRecords,
//   updateStockRecordStatus,
//   bulkDeductStock,
//   bulkCreateStockRecords,
//   getStockRecordsByLogId,
//   deleteStockRecord,
// } = require('../controllers/stockRecords.controller.js');

// router.get('/', getAllStockRecords);
// router.delete('/record/:id', deleteStockRecord);
// router.put('/:id', updateStockRecordStatus);
// router.post('/bulk-deduct', bulkDeductStock);
// router.post('/bulk-create', bulkCreateStockRecords);
// router.get('/log/:session_id', getStockRecordsByLogId);

// module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getVerifyStocks,
  approveStockLog,
  rejectStockLog,
  updateStockLog,
  bulkApproveStockLogs,
  bulkRejectStockLogs,
  bulkEditStockLogs,
  createVerifyStocks,
  getVerifyStocksBySessionId,
} = require('../controllers/stockRecords.controller.js');

// NOTE: bulk routes must be registered BEFORE the "/:id" route,
// otherwise Express will treat "bulk-approve" etc. as an :id param.
router.put('/bulk-approve', bulkApproveStockLogs);
router.put('/bulk-reject', bulkRejectStockLogs);
router.put('/bulk-edit', bulkEditStockLogs);

router.get('/', getVerifyStocks);
router.get('/record/:session_id', getVerifyStocksBySessionId);
router.post('/', createVerifyStocks);
router.put('/:id/approve', approveStockLog);
router.put('/:id/reject', rejectStockLog);
router.put('/:id', updateStockLog);

module.exports = router;
