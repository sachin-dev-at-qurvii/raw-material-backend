const express = require('express');
const {
  getStock,
  createStock,
  updateStock,
  deleteStock,
  updateMultipleStocks,
  addStockWithExistingStock,
  vendorSource,
  setBlockedStocksForVendor,
  updateStatus,
} = require('../controllers/stock.controller');
const router = express.Router();

router.route('/').get(getStock);

router.route('/create').post(createStock);
router.route('/bulk-update').put(updateMultipleStocks);
router.route('/update').put(addStockWithExistingStock);
router.route('/vendor-source').get(vendorSource);
router.route('/set-blocked-days').put(setBlockedStocksForVendor);
router.route('/status').put(updateStatus);
router.route('/:id').put(updateStock);
router.route('/:id').delete(deleteStock);

module.exports = router;
