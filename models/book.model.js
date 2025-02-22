const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    MaSach: { 
        type: String, 
        required: true, 
        unique: true 
    },
    TenSach: { 
        type: String, 
        required: true 
    },
    DongGia: Number,
    SoQuyen: { 
        type: Number, 
        default: 0 
    },
    MaNXB: {
        type: String,
        ref: 'Publisher',
        required: true
    },
    TheoDoi: {
        MaDocGia: String,
        NgayMuon: Date,
        NgayTra: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);
