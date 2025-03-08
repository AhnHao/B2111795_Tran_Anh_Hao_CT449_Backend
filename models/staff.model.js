const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    MSNV: {
      type: String,
      required: true,
      unique: true,
    },
    HoTenNV: {
      type: String,
      required: true,
    },
    Password: {
      type: String,
      required: true,
    },
    ChucVu: String,
    DiaChi: String,
    SoDienThoai: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Staff", staffSchema);
