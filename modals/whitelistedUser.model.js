const mongoose = require('mongoose');
const whitelistedSchema = new mongoose.Schema(
  {
    mobile_number: {
      type: Number,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: 'staff',
    },
  },
  {
    timestamps: true,
  }
);

const WhitelistedUser = mongoose.model('WhitelistedUser', whitelistedSchema);
module.exports = { WhitelistedUser };
