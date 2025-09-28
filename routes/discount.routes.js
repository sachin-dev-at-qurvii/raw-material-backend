const express = require("express")
const { bulkUpsertDiscounts, searchDiscounts } = require("../controllers/discount.controller.js");


const router = express.Router();

router.route("/bulk-upsert").post(bulkUpsertDiscounts);
router.route("/search").get(searchDiscounts)

module.exports = router;
