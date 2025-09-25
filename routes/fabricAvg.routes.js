const express = require("express");
const { upsertFabriPatterns, getFabricPatterns } = require("../controllers/fabricAvg.controller.js");
const router = express.Router();

router.route("/add-fabric-avg").post(upsertFabriPatterns);
router.route("/").get(getFabricPatterns)

module.exports = router;