const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const authJwt = require('../middleware/auth.jwt');

// Middleware để kiểm tra quyền admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'staff') {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Routes với middleware xác thực JWT và kiểm tra quyền
router.get('/', [authJwt.verifyToken, isAdmin], staffController.getAllStaff);
router.get('/:id', [authJwt.verifyToken, isAdmin], staffController.getStaffById);
router.post('/', [authJwt.verifyToken, isAdmin], staffController.createStaff);
router.put('/:id', [authJwt.verifyToken, isAdmin], staffController.updateStaff);
router.delete('/:id', [authJwt.verifyToken, isAdmin], staffController.deleteStaff);

module.exports = router;
