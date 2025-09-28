const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
    style_number: {
        type: Number,
        required: true,
    },
    style_name: {
        type: String,
        required: true,
    },
    cost: {
        type: Number,
        required: true
    },
    mrp: {
        type: Number,
        required: true
    }
});

const Discount = mongoose.model("Discount", discountSchema);
module.exports = Discount;