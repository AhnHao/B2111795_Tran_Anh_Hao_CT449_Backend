const mongoose = require("mongoose");

const readerSchema = new mongoose.Schema(
  {
    MaDocGia: {
      type: String,
      required: true,
      unique: true,
    },
    HoTen: {
      type: String,
      required: true,
    },
    Password: {
      type: String,
      required: true,
    },
    DiaChi: String,
    SoDienThoai: {
      type: String,
      required: true,
      unique: true,
    },
    NgaySinh: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reader", readerSchema);
