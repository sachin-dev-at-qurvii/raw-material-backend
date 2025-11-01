const mongoose = require("mongoose");
const accessroySchema = new mongoose.Schema({
    style_number: {
        type: Number,
        required: true
    },
    accessory_number: {
        type: String,
        required: true,
    },
    accessory_name: {
        type: String,

    },
    accessorry_type: {
        type: String,
    },
    accessory_image: {
        type: String,
    },
    stock_unit: {
        type: Number,
        default: 0
    }
},
    { timestamps: true });

const Accessory = mongoose.model("Accessory", accessroySchema);
module.exports = Accessory;