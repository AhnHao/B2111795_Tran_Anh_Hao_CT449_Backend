const BorrowRequest = require('../models/borrowRequest.model');
const Book = require('../models/book.model');

// Thêm yêu cầu mượn sách
exports.requestBorrow = async (req, res) => {
    try {
        const { MaSach } = req.body;
        
        // Kiểm tra sách tồn tại
        const book = await Book.findOne({ MaSach });
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }

        // Kiểm tra xem độc giả đã có yêu cầu mượn sách này chưa
        const existingRequest = await BorrowRequest.findOne({
            MaDocGia: req.user._id,
            MaSach,
            TrangThai: { $in: ['chờ duyệt', 'đã duyệt'] }
        });

        if (existingRequest) {
            return res.status(400).json({ 
                message: 'Bạn đã yêu cầu mượn hoặc đang mượn cuốn sách này' 
            });
        }

        // Tạo yêu cầu mượn mới
        const borrowRequest = new BorrowRequest({
            MaDocGia: req.user._id,
            MaSach,
            NgayYeuCau: new Date(),
            TrangThai: 'chờ duyệt'
        });

        await borrowRequest.save();
        res.status(201).json({ 
            message: 'Đã gửi yêu cầu mượn sách',
            data: borrowRequest 
        });

    } catch (error) {
        console.error('Lỗi khi tạo yêu cầu mượn:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra khi tạo yêu cầu mượn' });
    }
};

// Lấy tất cả yêu cầu mượn sách (cho staff)
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await BorrowRequest.find({
            TrangThai: 'chờ duyệt'
        }).populate('MaDocGia', 'HoTen');
        
        // Lấy thông tin sách cho mỗi yêu cầu
        const requestsWithBookInfo = await Promise.all(requests.map(async (request) => {
            const book = await Book.findOne({ MaSach: request.MaSach });
            return {
                ...request.toObject(),
                TenSach: book ? book.TenSach : 'Không tìm thấy'
            };
        }));
        
        res.json(requestsWithBookInfo);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu cầu:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Thêm hàm mới để lấy trạng thái sách
exports.getBookStatus = async (req, res) => {
    try {
        // Lấy tất cả yêu cầu mượn đang chờ duyệt hoặc đã duyệt
        const requests = await BorrowRequest.find({
            TrangThai: { $in: ['chờ duyệt', 'đã duyệt'] }
        });

        // Tạo object chứa trạng thái của từng sách
        const bookStatus = {};
        requests.forEach(request => {
            if (request.TrangThai === 'đã duyệt') {
                bookStatus[request.MaSach] = 'unavailable';
            } else if (request.TrangThai === 'chờ duyệt' && !bookStatus[request.MaSach]) {
                bookStatus[request.MaSach] = 'pending';
            }
        });

        res.json(bookStatus);
    } catch (error) {
        console.error('Lỗi khi lấy trạng thái sách:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Lấy sách đang mượn của độc giả
exports.getMyBorrowingBooks = async (req, res) => {
    try {
        const borrowings = await BorrowRequest.find({
            MaDocGia: req.user._id,
            TrangThai: 'đã duyệt',
            NgayTra: null
        });

        // Lấy thông tin sách từ bảng Book
        const borrowingsWithBookInfo = await Promise.all(borrowings.map(async (borrowing) => {
            const book = await Book.findOne({ MaSach: borrowing.MaSach });
            return {
                ...borrowing.toObject(),
                TenSach: book ? book.TenSach : 'Không tìm thấy'
            };
        }));

        res.json(borrowingsWithBookInfo);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sách đang mượn:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Lấy lịch sử mượn sách của độc giả
exports.getMyBorrowingHistory = async (req, res) => {
    try {
        const history = await BorrowRequest.find({
            MaDocGia: req.user._id,
            $or: [
                { TrangThai: 'đã trả' },
                { TrangThai: 'từ chối' }
            ]
        });

        // Lấy thông tin sách từ bảng Book
        const historyWithBookInfo = await Promise.all(history.map(async (item) => {
            const book = await Book.findOne({ MaSach: item.MaSach });
            return {
                ...item.toObject(),
                TenSach: book ? book.TenSach : 'Không tìm thấy'
            };
        }));

        res.json(historyWithBookInfo);
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử mượn sách:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Lấy yêu cầu chờ duyệt của độc giả
exports.getMyPendingRequests = async (req, res) => {
    try {
        const requests = await BorrowRequest.find({
            MaDocGia: req.user._id,
            TrangThai: 'chờ duyệt'
        });

        // Lấy thông tin sách từ bảng Book
        const requestsWithBookInfo = await Promise.all(requests.map(async (request) => {
            const book = await Book.findOne({ MaSach: request.MaSach });
            return {
                ...request.toObject(),
                TenSach: book ? book.TenSach : 'Không tìm thấy'
            };
        }));

        res.json(requestsWithBookInfo);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu cầu chờ duyệt:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Duyệt yêu cầu mượn sách
exports.approveRequest = async (req, res) => {
    try {
        const request = await BorrowRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
        }

        request.TrangThai = 'đã duyệt';
        request.NgayMuon = new Date();
        // Tính ngày hẹn trả (ví dụ: 14 ngày sau)
        request.NgayHenTra = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await request.save();

        res.json({ message: 'Đã duyệt yêu cầu mượn sách', data: request });
    } catch (error) {
        console.error('Lỗi khi duyệt yêu cầu:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Từ chối yêu cầu mượn sách
exports.rejectRequest = async (req, res) => {
    try {
        const request = await BorrowRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
        }

        request.TrangThai = 'từ chối';
        await request.save();
        res.json({ message: 'Đã từ chối yêu cầu mượn sách' });
    } catch (error) {
        console.error('Lỗi khi từ chối yêu cầu:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Lấy tất cả sách đang được mượn (cho staff)
exports.getAllBorrowingBooks = async (req, res) => {
    try {
        const borrowings = await BorrowRequest.find({
            TrangThai: 'đã duyệt',
            NgayTra: null
        }).populate('MaDocGia', 'HoTen');

        // Lấy thông tin sách
        const borrowingsWithBookInfo = await Promise.all(borrowings.map(async (borrowing) => {
            const book = await Book.findOne({ MaSach: borrowing.MaSach });
            return {
                ...borrowing.toObject(),
                TenSach: book ? book.TenSach : 'Không tìm thấy'
            };
        }));

        res.json(borrowingsWithBookInfo);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sách đang mượn:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Lấy tất cả lịch sử mượn sách (cho staff)
exports.getAllBorrowingHistory = async (req, res) => {
    try {
        const history = await BorrowRequest.find({
            $or: [
                { TrangThai: 'đã trả' },
                { TrangThai: 'từ chối' }
            ]
        }).populate('MaDocGia', 'HoTen');

        // Lấy thông tin sách
        const historyWithBookInfo = await Promise.all(history.map(async (item) => {
            const book = await Book.findOne({ MaSach: item.MaSach });
            return {
                ...item.toObject(),
                TenSach: book ? book.TenSach : 'Không tìm thấy'
            };
        }));

        res.json(historyWithBookInfo);
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử mượn sách:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
};

// Xử lý trả sách (cho độc giả)
exports.returnBook = async (req, res) => {
    try {
        const requestId = req.params.id;
        const borrowRequest = await BorrowRequest.findById(requestId);

        if (!borrowRequest) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu mượn sách' });
        }

        // Kiểm tra xem người dùng có phải là người mượn sách không
        if (borrowRequest.MaDocGia.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền trả sách này' });
        }

        // Kiểm tra trạng thái sách
        if (borrowRequest.TrangThai !== 'đã duyệt' || borrowRequest.NgayTra) {
            return res.status(400).json({ message: 'Không thể trả sách này' });
        }

        // Cập nhật thông tin trả sách
        borrowRequest.TrangThai = 'đã trả';
        borrowRequest.NgayTra = new Date();
        await borrowRequest.save();

        res.json({ message: 'Đã trả sách thành công', data: borrowRequest });
    } catch (error) {
        console.error('Lỗi khi xử lý trả sách:', error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra' });
    }
}; 