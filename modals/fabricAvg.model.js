const mongoose = require("mongoose");

const averagesSchema = new mongoose.Schema({
    average_xxs_xs: {
        type: Number,
        default: 0,
    },
    average_s_m: {
        type: Number,
        default: 0,
    },
    average_l_xl: {
        type: Number,
        default: 0,
    },
    average_2xl_3xl: {
        type: Number,
        default: 0
    },
    average_4xl_5xl: {
        type: Number,
        default: 0
    },
    width: {
        type: String,
        default: "Normal"
    }
})

const accessoriesSchema = new mongoose.Schema({
    average_xxs_m: {
        type: Number,
        default: 0
    },
    average_l_5xl: {
        type: Number,
        default: 0
    }
}
)

const fabricAvgSchema = new mongoose.Schema({
    style_number: {
        type: Number,
        required: true,
    },
    patternNumber: {
        type: String,
        required: true,
    },
    styleImage: {
        type: String,
    },
    fabrics: [averagesSchema],
    accessories: [accessoriesSchema]
}, {
    timestamps: true
});

const FabricAvg = mongoose.model("FabricAvg", fabricAvgSchema);
module.exports = FabricAvg;

