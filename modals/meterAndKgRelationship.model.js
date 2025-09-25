const mongoose = require("mongoose");

const meterAndKgRelationShipSchema = new mongoose.Schema({
    fabric_number: {
        type: Number,
        required: true,
    },
    fabric_in_meter: {
        type: Number,
        required: true,
    },
    fabric_in_KG: {
        type: Number,
        required: true,
    }
});

const MeterAndKgRelationShip = mongoose.model("MeterAndKgRelationShip", meterAndKgRelationShipSchema);
module.exports = MeterAndKgRelationShip;