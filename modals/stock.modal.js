const mongoose = require('mongoose');
const stockSchema = new mongoose.Schema(
  {
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
      default: 0,
    },
    location: {
      type: String,
      default: 'Default',
    },
    fabric_source: {
      type: String,
      default: 'Vender',
    },
    // vendor source and stock blocked quantity days fields
    vendor_source: {
      type: String,
    },
    blocked_stock_days: {
      type: Number,
      default: 7,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.model('Stock', stockSchema);
module.exports = Stock;
