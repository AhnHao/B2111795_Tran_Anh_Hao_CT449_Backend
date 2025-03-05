const Staff = require("../models/staff.model");
const Reader = require("../models/reader.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generateCode = require("../utils/generateCode");

// Đăng ký tài khoản nhân viên
exports.registerStaff = async (req, res) => {
  try {
    const { HoTenNV, Password, ChucVu, DiaChi, SoDienThoai } = req.body;

    // Kiểm tra số điện thoại đã tồn tại trong cả Staff và Reader
    const existingStaff = await Staff.findOne({ SoDienThoai });
    const existingReader = await Reader.findOne({ SoDienThoai });

    if (existingStaff || existingReader) {
      return res.status(400).json({
        message:
          "Số điện thoại đã được sử dụng để đăng ký tài khoản" 
      });
    }

    // Tạo mã nhân viên tự động
    const MSNV = await generateCode(Staff, "NV", "MSNV");

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(Password, 10);

    const newStaff = new Staff({
      MSNV,
      HoTenNV,
      Password: hashedPassword,
      ChucVu,
      DiaChi,
      SoDienThoai,
    });

    await newStaff.save();

    const staffResponse = newStaff.toObject();
    delete staffResponse.Password;

    res.status(201).json(staffResponse);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi đăng ký tài khoản nhân viên",
      error: error.message,
    });
  }
};

// Đăng ký tài khoản độc giả
exports.registerReader = async (req, res) => {
  try {
    const { HoTen, Password, DiaChi, SoDienThoai, NgaySinh } = req.body;

    // Kiểm tra số điện thoại đã tồn tại trong cả Staff và Reader
    const existingStaff = await Staff.findOne({ SoDienThoai });
    const existingReader = await Reader.findOne({ SoDienThoai });

    if (existingStaff || existingReader) {
      return res.status(400).json({
        message:
          "Số điện thoại đã được sử dụng để đăng ký tài khoản"
      });
    }

    // Tạo mã độc giả tự động
    const MaDocGia = await generateCode(Reader, "DG", "MaDocGia");

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(Password, 10);

    const newReader = new Reader({
      MaDocGia,
      HoTen,
      Password: hashedPassword,
      DiaChi,
      SoDienThoai,
      NgaySinh,
    });

    await newReader.save();

    const readerResponse = newReader.toObject();
    delete readerResponse.Password;

    res.status(201).json(readerResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Lỗi khi đăng ký tài khoản độc giả",
      error: error.message,
    });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { SoDienThoai, Password } = req.body;

    // Kiểm tra trong bảng Staff
    let user = await Staff.findOne({ SoDienThoai });
    let isStaff = true;

    // Nếu không tìm thấy trong Staff, kiểm tra trong Reader
    if (!user) {
      user = await Reader.findOne({ SoDienThoai });
      isStaff = false;
    }

    if (!user) {
      return res.status(401).json({ message: "Số điện thoại không tồn tại" });
    }

    const isValidPassword = await bcrypt.compare(Password, user.Password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: isStaff ? "staff" : "reader",
        SoDienThoai: user.SoDienThoai,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      token,
      role: isStaff ? "staff" : "reader",
      user: {
        id: user._id,
        code: isStaff ? user.MSNV : user.MaDocGia,
        name: isStaff ? user.HoTenNV : user.HoTen,
        SoDienThoai: user.SoDienThoai,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.staffLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const staff = await Staff.findOne({ username });

    if (!staff || !bcrypt.compareSync(password, staff.password)) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { id: staff._id, role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: staff._id,
        username: staff.username,
        role: "staff",
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

exports.readerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const reader = await Reader.findOne({ username });

    if (!reader || !bcrypt.compareSync(password, reader.password)) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { id: reader._id, role: "reader" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: reader._id,
        username: reader.username,
        role: "reader",
      },
    });
  } catch (error) {
    console.error("Reader login error:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};
