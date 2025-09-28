const express = require("express");
const { sendNotificationToEmail } = require("../controllers/orderNorifier.controller.js");
const router = express();

router.route("/send").post(sendNotificationToEmail);

module.exports = router;