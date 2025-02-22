const Book = require('../models/book.model');
const Publisher = require('../models/publisher.model');
const generateCode = require('../utils/generateCode');

exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find()
            .populate('MaNXB', 'TenNXB');
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sách', error: error.message });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('MaNXB', 'TenNXB');
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin sách', error: error.message });
    }
};

exports.createBook = async (req, res) => {
    try {
        const { TenSach, DongGia, SoQuyen, MaNXB } = req.body;

        // Kiểm tra nhà xuất bản tồn tại
        const publisher = await Publisher.findOne({ MaNXB });
        if (!publisher) {
            return res.status(400).json({ message: 'Nhà xuất bản không tồn tại' });
        }

        // Tạo mã sách tự động
        const MaSach = await generateCode(Book, 'S', 'MaSach');

        const newBook = new Book({
            MaSach,
            TenSach,
            DongGia,
            SoQuyen,
            MaNXB
        });

        await newBook.save();
        
        const savedBook = await Book.findById(newBook._id)
            .populate('MaNXB', 'TenNXB');
        
        res.status(201).json(savedBook);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo sách mới', error: error.message });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const { TenSach, DongGia, SoQuyen, MaNXB } = req.body;
        const bookId = req.params.id;

        // Kiểm tra nhà xuất bản tồn tại nếu có cập nhật MaNXB
        if (MaNXB) {
            const publisher = await Publisher.findOne({ MaNXB });
            if (!publisher) {
                return res.status(400).json({ message: 'Nhà xuất bản không tồn tại' });
            }
        }

        const book = await Book.findByIdAndUpdate(
            bookId,
            { TenSach, DongGia, SoQuyen, MaNXB },
            { new: true }
        ).populate('MaNXB', 'TenNXB');

        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }

        res.json(book);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật sách', error: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }

        // Kiểm tra xem sách có đang được mượn không
        if (book.TheoDoi && book.TheoDoi.MaDocGia) {
            return res.status(400).json({ message: 'Không thể xóa sách đang được mượn' });
        }

        await book.deleteOne();
        res.json({ message: 'Đã xóa sách thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa sách', error: error.message });
    }
};

// Tìm kiếm sách
exports.searchBooks = async (req, res) => {
    try {
        const { keyword } = req.query;
        const searchQuery = {
            $or: [
                { TenSach: { $regex: keyword, $options: 'i' } },
                { MaSach: { $regex: keyword, $options: 'i' } }
            ]
        };

        const books = await Book.find(searchQuery)
            .populate('MaNXB', 'TenNXB');
        
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tìm kiếm sách', error: error.message });
    }
};
