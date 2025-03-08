const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  MaSach: {
    type: String,
    required: true,
    unique: true,
  },
  TenSach: {
    type: String,
    required: true,
  },
  TacGia: {
    type: String,
    required: true,
  },
  MaNXB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Publisher",
    required: true,
  },
  NamXB: {
    type: Number,
    required: true,
  },
  DonGia: {
    type: Number,
    required: true,
  },
  SoQuyen: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Book", bookSchema);
