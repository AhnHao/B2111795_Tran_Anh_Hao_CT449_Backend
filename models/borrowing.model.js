const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({
    MaDocGia: {
        type: String,
        required: true,
        ref: 'Reader'
    },
    MaSach: {
        type: String,
        required: true,
        ref: 'Book'
    },
    NgayYeuCau: {
        type: Date,
        default: Date.now
    },
    NgayMuon: Date,
    NgayHenTra: Date,
    NgayTra: Date,
    TrangThai: {
        type: String,
        enum: ['chờ duyệt', 'đã duyệt', 'đã trả', 'từ chối'],
        default: 'chờ duyệt'
    },
    GhiChu: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Borrowing', borrowingSchema);
