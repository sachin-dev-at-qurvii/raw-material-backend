const express = require("express");
const { getAllStocks, bulkCreateOrUpdateStock } = require("../controllers/stock2.controller");
const router = express.Router();


router.get("/", getAllStocks);
router.post("/bulk", bulkCreateOrUpdateStock);

module.exports = router;
