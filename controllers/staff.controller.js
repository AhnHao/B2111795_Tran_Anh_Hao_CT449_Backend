const Staff = require('../models/staff.model');
const bcrypt = require('bcryptjs');
const generateCode = require('../utils/generateCode');

exports.getAllStaff = async (req, res) => {
    try {
        const staffs = await Staff.find().select('-Password');
        res.json(staffs);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên', error: error.message });
    }
};

exports.getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id).select('-Password');
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin nhân viên', error: error.message });
    }
};

exports.createStaff = async (req, res) => {
    try {
        const { HoTenNV, Password, ChucVu, DiaChi, SoDienThoai } = req.body;

        // Kiểm tra SoDienThoai đã tồn tại
        const existingStaffPhone = await Staff.findOne({ SoDienThoai });
        if (existingStaffPhone) {
            return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
        }

        // Tạo mã nhân viên tự động
        const MSNV = await generateCode(Staff, 'NV', 'MSNV');

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(Password, 10);

        const newStaff = new Staff({
            MSNV,
            HoTenNV,
            Password: hashedPassword,
            ChucVu,
            DiaChi,
            SoDienThoai
        });

        await newStaff.save();
        
        const staffResponse = newStaff.toObject();
        delete staffResponse.Password;
        
        res.status(201).json(staffResponse);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo nhân viên mới', error: error.message });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const { HoTenNV, ChucVu, DiaChi, SoDienThoai, Password } = req.body;
        const staffId = req.params.id;

        const updateData = {
            HoTenNV,
            ChucVu,
            DiaChi,
            SoDienThoai
        };

        // Nếu có cập nhật mật khẩu
        if (Password) {
            updateData.Password = await bcrypt.hash(Password, 10);
        }

        const staff = await Staff.findByIdAndUpdate(
            staffId,
            updateData,
            { new: true, runValidators: true }
        ).select('-Password');

        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật nhân viên', error: error.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }
        res.json({ message: 'Đã xóa nhân viên thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa nhân viên', error: error.message });
    }
};
