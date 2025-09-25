const express = require("express");
const { addMeterAndKgRelationship, getMeterAndKgRelationshiop } = require("../controllers/meterAndKgRelationship.controller.js");
const { authorizeRoles, authenticateJWT } = require("../middlewares/auth.middlewares.js");
const router = express.Router();

// router.route("/add-relationship").post(authenticateJWT, authorizeRoles("admin",), addMeterAndKgRelationship);

router.route("/add-relationship").post(addMeterAndKgRelationship);
router.route("/get-relationship").get(getMeterAndKgRelationshiop);

module.exports = router;