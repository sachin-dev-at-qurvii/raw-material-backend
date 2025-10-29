const mongoose = require("mongoose");

const mappedOrderIdWithStyleNumberShema = new mongoose.Schema({
    order_id: {
        type: Number,
        required: true,
    },
    style_number: {
        type: Number,
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    rack_space: {
        type: String,
        required: true,
    },
    inStock: {
        type: Number,
        default: 0
    }
},
    { timestamps: true }
);

const MappedOrderId = mongoose.model("MappedOrderId", mappedOrderIdWithStyleNumberShema);
module.exports = MappedOrderId;