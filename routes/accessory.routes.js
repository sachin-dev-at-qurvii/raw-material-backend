const express = require("express");
const router = express.Router();
const {
    createAccessory,
    getAllAccessories,
    getAccessoryById,
    updateAccessory,
    deleteAccessory,
    bulkUpsertAccessories,
} = require("../controllers/accessory.controller");

router.route("/").post(createAccessory).get(getAllAccessories);
router.route("/bulk-upsert").post(bulkUpsertAccessories);
router.route("/:id").get(getAccessoryById).delete(deleteAccessory);
router.route("/:accessory_number").put(updateAccessory)

module.exports = router;
