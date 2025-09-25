const express = require("express");
const { createStyle, getStyle, updateStyle, deleteStyle } = require("../controllers/style.controller");
const { authenticateJWT, authorizeRoles } = require("../middlewares/auth.middlewares");
const router = express.Router();


router.route("/").get(getStyle);
router.route("/").post(authenticateJWT, authorizeRoles("admin"), createStyle);
router.route("/:id").put(authenticateJWT, authorizeRoles("admin"), updateStyle);
router.route("/:id").delete(authenticateJWT, authorizeRoles("admin"), deleteStyle);


module.exports = router;