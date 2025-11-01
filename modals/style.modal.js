const mongoose = require("mongoose");

const fabricSchema = new mongoose.Schema({
  fabric_no: { type: Number },
  fabric_name: { type: String },
  fabric_image: { type: String },
});

const accessorySchema = new mongoose.Schema({
  accessory_no: {
    type: String,
  },
  accessory_name: {
    type: String,
  },
  accessory_type: {
    type: String,
  },
  accessory_image: {
    type: String,
  }
})

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

  accessories: [accessorySchema], // Array of accessories
},
  {
    timestamps: true
  });

const Style = mongoose.model("Style", styleSchema);
module.exports = Style;