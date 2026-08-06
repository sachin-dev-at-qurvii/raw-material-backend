const mongoose = require('mongoose');
const stockLogSchema = new mongoose.Schema(
  {
    log_id: { type: Number, required: true },
    source: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const StockLog = mongoose.model('StockLog', stockLogSchema);
module.exports = StockLog;
