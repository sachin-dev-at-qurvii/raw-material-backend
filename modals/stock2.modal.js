const mongoose = require("mongoose");

const stock2Schema = new mongoose.Schema({
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
        required: true

    }
});

const Stock2 = mongoose.model("Stock2", stock2Schema);
module.exports = Stock2;
