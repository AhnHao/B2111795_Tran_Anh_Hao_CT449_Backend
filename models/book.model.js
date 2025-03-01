const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    MaSach: {
      type: String,
      required: true,
      unique: true,
    },
    TenSach: {
      type: String,
      required: true,
    },
    MaNXB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publisher",
    },
    DonGia: {
      type: Number,
      required: true,
    },
    SoQuyen: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);
