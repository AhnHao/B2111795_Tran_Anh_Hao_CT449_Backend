const express = require('express');
const router = express.Router();
const readerController = require('../controllers/reader.controller');
const authJwt = require('../middleware/auth.jwt');

// Middleware để kiểm tra quyền staff
const isStaff = (req, res, next) => {
    if (req.user && req.user.role === 'staff') {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Middleware để kiểm tra quyền của chính độc giả
const isOwner = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.id === req.params.id)) {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập' });
    }
};

// Routes với middleware xác thực và phân quyền
router.get('/', [authJwt.verifyToken, isStaff], readerController.getAllReaders);
router.get('/:id', [authJwt.verifyToken, isOwner], readerController.getReaderById);
router.post('/', [authJwt.verifyToken, isStaff], readerController.createReader);
router.put('/:id', [authJwt.verifyToken, isOwner], readerController.updateReader);
router.delete('/:id', [authJwt.verifyToken, isStaff], readerController.deleteReader);

module.exports = router;
