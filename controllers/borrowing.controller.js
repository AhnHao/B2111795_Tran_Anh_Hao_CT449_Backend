const Borrowing = require('../models/borrowing.model');
const Book = require('../models/book.model');
const Reader = require('../models/reader.model');

exports.getAllBorrowings = async (req, res) => {
    try {
        const borrowings = await Borrowing.find()
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');
        res.json(borrowings);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách mượn sách', error: error.message });
    }
};

exports.getBorrowingById = async (req, res) => {
    try {
        const borrowing = await Borrowing.findById(req.params.id)
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');
        if (!borrowing) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin mượn sách' });
        }
        res.json(borrowing);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin mượn sách', error: error.message });
    }
};

exports.createBorrowing = async (req, res) => {
    try {
        const { MaDocGia, MaSach, NgayHenTra } = req.body;

        // Kiểm tra độc giả tồn tại
        const reader = await Reader.findOne({ MaDocGia });
        if (!reader) {
            return res.status(400).json({ message: 'Độc giả không tồn tại' });
        }

        // Kiểm tra sách tồn tại và có sẵn để mượn
        const book = await Book.findOne({ MaSach });
        if (!book) {
            return res.status(400).json({ message: 'Sách không tồn tại' });
        }
        if (book.TheoDoi && book.TheoDoi.MaDocGia) {
            return res.status(400).json({ message: 'Sách đã được mượn' });
        }

        const newBorrowing = new Borrowing({
            MaDocGia,
            MaSach,
            NgayMuon: new Date(),
            NgayHenTra,
            TrangThai: 'đang mượn'
        });

        // Cập nhật trạng thái sách
        await Book.findOneAndUpdate(
            { MaSach },
            { 
                TheoDoi: {
                    MaDocGia,
                    NgayMuon: new Date()
                }
            }
        );

        await newBorrowing.save();
        
        const savedBorrowing = await Borrowing.findById(newBorrowing._id)
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');
        
        res.status(201).json(savedBorrowing);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo phiếu mượn sách', error: error.message });
    }
};

exports.returnBook = async (req, res) => {
    try {
        const borrowingId = req.params.id;
        const borrowing = await Borrowing.findById(borrowingId);
        
        if (!borrowing) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin mượn sách' });
        }
        
        if (borrowing.TrangThai === 'đã trả') {
            return res.status(400).json({ message: 'Sách đã được trả trước đó' });
        }

        // Cập nhật trạng thái mượn sách
        borrowing.NgayTra = new Date();
        borrowing.TrangThai = 'đã trả';
        await borrowing.save();

        // Cập nhật trạng thái sách
        await Book.findOneAndUpdate(
            { MaSach: borrowing.MaSach },
            { $unset: { TheoDoi: "" } }
        );

        const updatedBorrowing = await Borrowing.findById(borrowingId)
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');

        res.json(updatedBorrowing);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi trả sách', error: error.message });
    }
};

// Lấy lịch sử mượn sách của độc giả
exports.getReaderBorrowings = async (req, res) => {
    try {
        const MaDocGia = req.params.readerId;
        const borrowings = await Borrowing.find({ MaDocGia })
            .populate('MaSach', 'TenSach')
            .sort({ NgayMuon: -1 });
        
        res.json(borrowings);
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi lấy lịch sử mượn sách', 
            error: error.message 
        });
    }
};

// Lấy danh sách sách đang được mượn
exports.getCurrentBorrowings = async (req, res) => {
    try {
        const borrowings = await Borrowing.find({ TrangThai: 'đang mượn' })
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');
        
        res.json(borrowings);
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi lấy danh sách sách đang mượn', 
            error: error.message 
        });
    }
};

// Độc giả gửi yêu cầu mượn sách
exports.requestBorrow = async (req, res) => {
    try {
        const { MaSach } = req.body;
        const MaDocGia = req.user.id; // Lấy từ token

        // Kiểm tra sách tồn tại và có sẵn
        const book = await Book.findOne({ MaSach });
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }

        // Kiểm tra sách đã có người mượn chưa
        if (book.TheoDoi && book.TheoDoi.MaDocGia) {
            return res.status(400).json({ message: 'Sách đã có người mượn' });
        }

        // Kiểm tra độc giả có đang yêu cầu mượn sách này không
        const existingRequest = await Borrowing.findOne({
            MaDocGia,
            MaSach,
            TrangThai: 'chờ duyệt'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Bạn đã gửi yêu cầu mượn sách này rồi' });
        }

        const newBorrowing = new Borrowing({
            MaDocGia,
            MaSach,
            NgayYeuCau: new Date(),
            NgayHenTra: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 ngày sau
        });

        await newBorrowing.save();

        const borrowingDetails = await Borrowing.findById(newBorrowing._id)
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');

        res.status(201).json(borrowingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi gửi yêu cầu mượn sách', error: error.message });
    }
};

// Nhân viên xem danh sách yêu cầu chờ duyệt
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await Borrowing.find({ TrangThai: 'chờ duyệt' })
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach')
            .sort({ NgayYeuCau: 1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu cầu', error: error.message });
    }
};

// Nhân viên duyệt yêu cầu mượn sách
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, GhiChu } = req.body;

        const borrowing = await Borrowing.findById(id);
        if (!borrowing) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn sách' });
        }

        if (borrowing.TrangThai !== 'chờ duyệt') {
            return res.status(400).json({ message: 'Yêu cầu này đã được xử lý' });
        }

        if (approved) {
            // Kiểm tra lại sách có sẵn không
            const book = await Book.findOne({ MaSach: borrowing.MaSach });
            if (book.TheoDoi && book.TheoDoi.MaDocGia) {
                return res.status(400).json({ message: 'Sách đã có người mượn' });
            }

            // Cập nhật trạng thái mượn
            borrowing.TrangThai = 'đã duyệt';
            borrowing.NgayMuon = new Date();
            
            // Cập nhật trạng thái sách
            await Book.findOneAndUpdate(
                { MaSach: borrowing.MaSach },
                { 
                    TheoDoi: {
                        MaDocGia: borrowing.MaDocGia,
                        NgayMuon: new Date()
                    }
                }
            );
        } else {
            borrowing.TrangThai = 'từ chối';
        }

        if (GhiChu) {
            borrowing.GhiChu = GhiChu;
        }

        await borrowing.save();

        const updatedBorrowing = await Borrowing.findById(id)
            .populate('MaDocGia', 'HoTen')
            .populate('MaSach', 'TenSach');

        res.json(updatedBorrowing);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi duyệt yêu cầu mượn sách', error: error.message });
    }
};

// Xem danh sách sách đã mượn của độc giả
exports.getBorrowedBooks = async (req, res) => {
    try {
        const MaDocGia = req.user.id;
        const borrowings = await Borrowing.find({
            MaDocGia,
            TrangThai: 'đã duyệt'
        })
        .populate('MaSach', 'TenSach')
        .sort({ NgayMuon: -1 });

        res.json(borrowings);
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi lấy danh sách sách đã mượn', 
            error: error.message 
        });
    }
};

// Xem lịch sử mượn sách của độc giả
exports.getBorrowingHistory = async (req, res) => {
    try {
        const MaDocGia = req.user.id;
        const history = await Borrowing.find({
            MaDocGia,
            TrangThai: { $in: ['đã trả', 'từ chối'] }
        })
        .populate('MaSach', 'TenSach')
        .sort({ updatedAt: -1 });

        res.json(history);
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi lấy lịch sử mượn sách', 
            error: error.message 
        });
    }
};
