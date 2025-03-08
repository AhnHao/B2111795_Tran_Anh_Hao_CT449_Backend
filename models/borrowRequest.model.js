const mongoose = require("mongoose");

const borrowRequestSchema = new mongoose.Schema(
  {
    MaDocGia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },
    MaSach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    NgayYeuCau: {
      type: Date,
      default: Date.now,
    },
    NgayMuon: Date,
    NgayHenTra: Date,
    NgayTra: Date,
    TrangThai: {
      type: String,
      enum: ["chờ duyệt", "đã duyệt", "từ chối", "đã trả"],
      default: "chờ duyệt",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BorrowRequest", borrowRequestSchema);
