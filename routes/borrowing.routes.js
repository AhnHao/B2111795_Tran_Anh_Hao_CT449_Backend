const express = require('express');
const router = express.Router();
const borrowingController = require('../controllers/borrowing.controller');
const authJwt = require('../middleware/auth.jwt');

// Middleware kiểm tra quyền nhân viên
const isStaff = (req, res, next) => {
    if (req.user && req.user.role === 'staff') {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Middleware kiểm tra quyền độc giả
const isReader = (req, res, next) => {
    if (req.user && req.user.role === 'reader') {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Middleware kiểm tra quyền của chính độc giả hoặc nhân viên
const isOwnerOrStaff = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.id === req.params.readerId)) {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Routes cho độc giả
router.post('/request', [authJwt.verifyToken, isReader], borrowingController.requestBorrow);
router.get('/borrowed', [authJwt.verifyToken, isReader], borrowingController.getBorrowedBooks);
router.get('/history', [authJwt.verifyToken, isReader], borrowingController.getBorrowingHistory);
router.put('/:id/return', [authJwt.verifyToken, isReader], borrowingController.returnBook);

// Routes cho nhân viên
router.get('/pending', [authJwt.verifyToken, isStaff], borrowingController.getPendingRequests);
router.put('/:id/approve', [authJwt.verifyToken, isStaff], borrowingController.approveRequest);

module.exports = router;
