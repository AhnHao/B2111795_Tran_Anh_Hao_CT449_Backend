const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authJwt = require('../middleware/auth.jwt');

// Middleware kiểm tra quyền nhân viên
const isStaff = (req, res, next) => {
    if (req.user && req.user.role === 'staff') {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Routes công khai - ai cũng có thể xem và tìm kiếm sách
router.get('/', bookController.getAllBooks);
router.get('/search', bookController.searchBooks);
router.get('/:id', bookController.getBookById);

// Routes yêu cầu quyền nhân viên
router.post('/', [authJwt.verifyToken, isStaff], bookController.createBook);
router.put('/:id', [authJwt.verifyToken, isStaff], bookController.updateBook);
router.delete('/:id', [authJwt.verifyToken, isStaff], bookController.deleteBook);

module.exports = router;
