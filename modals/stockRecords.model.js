const mongoose = require('mongoose');

const stockRecordsSchema = new mongoose.Schema({
  fabric_number: {
    type: Number,
    required: true,
  },
  fabric_name: {
    type: String,
    required: true,
  },
  employee_number: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  session_id: {
    type: Number,
    required: true,
  },
  old_stock: {
    type: Number,
    required: true,
  },
  added_stock: {
    type: Number,
    required: true,
  },
  current_stock: {
    type: Number,
    default: 0,
  },
  source: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'pending',
  },
  is_stock_added: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: 'normal',
  },
});

// For create() and save()
stockRecordsSchema.pre('save', function (next) {
  this.current_stock = this.old_stock + this.added_stock;
  next();
});

// For insertMany()
stockRecordsSchema.pre('insertMany', function (next, docs) {
  docs.forEach((doc) => {
    doc.current_stock = doc.old_stock + doc.added_stock;
  });

  next();
});

const StockRecords = mongoose.model('StockRecords', stockRecordsSchema);

module.exports = StockRecords;
