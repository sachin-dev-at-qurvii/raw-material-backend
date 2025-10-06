const express = require("express");
const { upsertFabricRateDetails, getFabricRateDetails } = require("../controllers/fabricRate.controller");
const router = express.Router();

router.route("/add-fabric-details").post(upsertFabricRateDetails);
router.route("/").get(getFabricRateDetails);

module.exports = router;