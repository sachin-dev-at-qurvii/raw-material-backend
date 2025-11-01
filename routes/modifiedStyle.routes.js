const express = require("express");
const { bulkCreateOrUpdateStyles, getStyle } = require("../controllers/modifiedStyle.controller");

const router = express.Router();


router.route("/").get(getStyle);
router.route("/").post(bulkCreateOrUpdateStyles);

module.exports = router;