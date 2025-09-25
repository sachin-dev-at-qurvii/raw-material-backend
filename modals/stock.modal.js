const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
    fabricName: {
        type: String,
        // unique: true,
        // required: true,
    },
    fabricNumber: {
        type: Number,
        // required: true,
        // unique: true,
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
});

const Stock = mongoose.model("Stock", stockSchema);
module.exports = Stock;
