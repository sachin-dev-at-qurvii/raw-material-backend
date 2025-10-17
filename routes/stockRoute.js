const express = require("express");
const { getStock, createStock, updateStock, deleteStock, updateMultipleStocks } = require("../controllers/stock.controller");
const router = express.Router();


router.route("/").get(getStock);


router.route("/create").post(createStock);
router.route("/bulk-update").put(updateMultipleStocks);
router.route("/:id").put(updateStock);
router.route("/:id").delete(deleteStock);

module.exports = router;
