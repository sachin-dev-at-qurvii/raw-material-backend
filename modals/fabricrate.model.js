const mongoose = require("mongoose");

const purchase_history_schema = new mongoose.Schema({
    fabric_number: {
        type: Number,
        required: true,
    },
    fabric_name: { type: String },
    vender: { type: String },
    fabric_rate: { type: Number },
    unit: { type: String },
    fabric_length: { type: String },
    recieved_qty_meter: { type: Number },
    recieved_qty_kg: { type: Number },
    width: { type: String, default: "Normal" },
    recieved_date: { type: Date }
})

const fabricRateSchema = new mongoose.Schema({
    fabric_number: { type: Number, required: true },
    fabric_name: { type: String },
    vender: { type: String },
    fabric_rate: { type: Number },
    unit: { type: String },
    fabric_length: { type: String },
    recieved_qty_meter: { type: Number },
    recieved_qty_kg: { type: Number },
    width: { type: String, default: "Normal" },
    recieved_date: { type: Date },
    purchase_history: { type: [purchase_history_schema] }
}, { timestamps: true });

const FabricRate = mongoose.model("FabricRate", fabricRateSchema);
module.exports = FabricRate;
