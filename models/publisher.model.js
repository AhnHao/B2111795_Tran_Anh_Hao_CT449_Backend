const mongoose = require("mongoose");

const publisherSchema = new mongoose.Schema(
  {
    MaNXB: {
      type: String,
      required: true,
      unique: true,
    },
    TenNXB: {
      type: String,
      required: true,
    },
    DiaChi: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Publisher", publisherSchema);
