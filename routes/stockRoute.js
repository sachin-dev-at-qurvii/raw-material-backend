const express = require("express");
const { getStock, createStock, updateStock, deleteStock } = require("../controllers/stock.controller");
const { authenticateJWT, authorizeRoles } = require("../middlewares/auth.middlewares");
const router = express.Router();


router.route("/").get(getStock);
router.route("/create").post(authenticateJWT, authorizeRoles('admin'), createStock);
router.route("/:id").put(authenticateJWT, authorizeRoles("admin"), updateStock);
router.route("/:id").delete(authenticateJWT, authorizeRoles("admin"), deleteStock);

module.exports = router;