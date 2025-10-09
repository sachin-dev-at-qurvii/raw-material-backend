const express = require("express");
const { upsertMappedOrderIdWithStyleNumber, getMappedOrderIdsStyleNumber,getRackSpaceDetails } = require("../controllers/mapped_order_id_with_styleNumber.controller");
const router = express.Router();

router.route("/upsertRackSpace").post(upsertMappedOrderIdWithStyleNumber);
router.route("/get-mapped-style-id").get(getMappedOrderIdsStyleNumber);
router.route("/get-rackspace").get(getRackSpaceDetails);


module.exports = router
