const mongoose = require("mongoose");

const fabricSchema = new mongoose.Schema({
  fabric_no: { type: Number },
  fabric_name: { type: String },
  fabric_image: { type: String },
  average_xxs_m: { type: Number, default: 0 },
  average_l_5xl: { type: Number, default: 0 },
});

const styleSchema = new mongoose.Schema({
  styleNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  patternNumber: {
    type: String,
  },
  styleImage: {
    type: String,
  },
  fabrics: [fabricSchema], // Array of fabrics
  accessories: [
    { accessory_no: { type: Number } } // Array of accessories
  ],
});

const Style = mongoose.model("Style", styleSchema);
module.exports = Style;