const jwt = require('jsonwebtoken');
const Staff = require('../models/staff.model');
const Reader = require('../models/reader.model');

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kiểm tra xem user là staff hay reader
        let user;
        if (decoded.role === 'staff') {
            user = await Staff.findById(decoded.id);
        } else {
            user = await Reader.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại' });
        }

        req.user = {
            _id: user._id,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

exports.isStaff = (req, res, next) => {
    if (req.user && req.user.role === 'staff') {
        next();
    } else {
        res.status(403).json({ message: 'Yêu cầu quyền quản lý' });
    }
};

exports.isReader = (req, res, next) => {
    if (req.user && req.user.role === 'reader') {
        next();
    } else {
        res.status(403).json({ message: 'Yêu cầu quyền độc giả' });
    }
};
