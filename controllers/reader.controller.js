const Reader = require('../models/reader.model');
const bcrypt = require('bcryptjs');
const generateCode = require('../utils/generateCode');

exports.getAllReaders = async (req, res) => {
    try {
        const readers = await Reader.find().select('-Password');
        res.json(readers);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách độc giả', error: error.message });
    }
};

exports.getReaderById = async (req, res) => {
    try {
        const reader = await Reader.findById(req.params.id).select('-Password');
        if (!reader) {
            return res.status(404).json({ message: 'Không tìm thấy độc giả' });
        }
        res.json(reader);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin độc giả', error: error.message });
    }
};

exports.createReader = async (req, res) => {
    try {
        const { HoTen, Password, DiaChi, SoDienThoai, NgaySinh } = req.body;

        // Kiểm tra SoDienThoai đã tồn tại
        const existingReaderPhone = await Reader.findOne({ SoDienThoai });
        if (existingReaderPhone) {
            return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
        }

        // Tạo mã độc giả tự động
        const MaDocGia = await generateCode(Reader, 'DG', 'MaDocGia');

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(Password, 10);

        const newReader = new Reader({
            MaDocGia,
            HoTen,
            Password: hashedPassword,
            DiaChi,
            SoDienThoai,
            NgaySinh
        });

        await newReader.save();
        
        const readerResponse = newReader.toObject();
        delete readerResponse.Password;
        
        res.status(201).json(readerResponse);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo độc giả mới', error: error.message });
    }
};

exports.updateReader = async (req, res) => {
    try {
        const { HoTen, DiaChi, SoDienThoai, NgaySinh, Password } = req.body;
        const readerId = req.params.id;

        const updateData = {
            HoTen,
            DiaChi,
            SoDienThoai,
            NgaySinh
        };

        // Nếu có cập nhật mật khẩu
        if (Password) {
            updateData.Password = await bcrypt.hash(Password, 10);
        }

        const reader = await Reader.findByIdAndUpdate(
            readerId,
            updateData,
            { new: true, runValidators: true }
        ).select('-Password');

        if (!reader) {
            return res.status(404).json({ message: 'Không tìm thấy độc giả' });
        }

        res.json(reader);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật độc giả', error: error.message });
    }
};

exports.deleteReader = async (req, res) => {
    try {
        const reader = await Reader.findByIdAndDelete(req.params.id);
        if (!reader) {
            return res.status(404).json({ message: 'Không tìm thấy độc giả' });
        }
        res.json({ message: 'Đã xóa độc giả thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa độc giả', error: error.message });
    }
};
