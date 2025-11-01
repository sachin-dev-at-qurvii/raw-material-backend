const mongoose = require("mongoose");
const stockSchema = new mongoose.Schema({
    fabricName: {
        type: String,
    },
    fabricNumber: {
        type: Number,
    },
    styleNumbers: {
        type: [Number],
        default: [],
    },
    availableStock: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        default: "Default",
    },
    fabric_source: {
        type: String,
        default: "Vender"
    }
}, {
    timestamps: true
});

const Stock = mongoose.model("Stock", stockSchema);
module.exports = Stock;
