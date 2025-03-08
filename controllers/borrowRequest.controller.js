const BorrowRequest = require("../models/borrowRequest.model");
const Book = require("../models/book.model");

// Thêm yêu cầu mượn sách
exports.requestBorrow = async (req, res) => {
  try {
    const { MaSach } = req.body;

    // Kiểm tra sách tồn tại và số lượng
    const book = await Book.findOne({ MaSach: MaSach });
    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    // Kiểm tra số lượng sách
    if (book.SoQuyen <= 0) {
      return res.status(400).json({ message: "Sách đã hết, không thể mượn" });
    }

    // Kiểm tra yêu cầu trùng lặp
    const existingRequest = await BorrowRequest.findOne({
      MaDocGia: req.user._id,
      MaSach: book._id,
      TrangThai: { $in: ["chờ duyệt", "đã duyệt"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Bạn đã yêu cầu mượn hoặc đang mượn cuốn sách này",
      });
    }

    // Tạo yêu cầu mượn mới
    const borrowRequest = new BorrowRequest({
      MaDocGia: req.user._id,
      MaSach: book._id,
      NgayYeuCau: new Date(),
      TrangThai: "chờ duyệt",
    });

    await borrowRequest.save();
    res.status(201).json({
      message: "Đã gửi yêu cầu mượn sách",
      data: borrowRequest,
    });
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu mượn:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra khi tạo yêu cầu mượn" });
  }
};

// Lấy tất cả yêu cầu mượn sách (cho staff)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({
      TrangThai: "chờ duyệt",
    })
      .populate("MaDocGia", "HoTen")
      .populate("MaSach", "TenSach MaSach");

    res.json(requests);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Thêm hàm mới để lấy trạng thái sách
exports.getBookStatus = async (req, res) => {
  try {
    // Lấy tất cả yêu cầu mượn đang chờ duyệt hoặc đã duyệt
    const requests = await BorrowRequest.find({
      TrangThai: { $in: ["chờ duyệt", "đã duyệt"] },
    });

    // Tạo object chứa trạng thái của từng sách
    const bookStatus = {};
    requests.forEach((request) => {
      if (request.TrangThai === "đã duyệt") {
        bookStatus[request.MaSach] = "unavailable";
      } else if (
        request.TrangThai === "chờ duyệt" &&
        !bookStatus[request.MaSach]
      ) {
        bookStatus[request.MaSach] = "pending";
      }
    });

    res.json(bookStatus);
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái sách:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Lấy sách đang mượn của độc giả
exports.getMyBorrowingBooks = async (req, res) => {
  try {
    const borrowings = await BorrowRequest.find({
      MaDocGia: req.user._id,
      TrangThai: "đã duyệt",
      NgayTra: null,
    }).populate("MaSach", "TenSach MaSach");

    res.json(borrowings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sách đang mượn:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Lấy lịch sử mượn sách của độc giả
exports.getMyBorrowingHistory = async (req, res) => {
  try {
    const history = await BorrowRequest.find({
      MaDocGia: req.user._id,
      $or: [{ TrangThai: "đã trả" }, { TrangThai: "từ chối" }],
    }).populate("MaSach", "TenSach MaSach");

    res.json(history);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử mượn sách:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Lấy yêu cầu chờ duyệt của độc giả
exports.getMyPendingRequests = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({
      MaDocGia: req.user._id,
      TrangThai: "chờ duyệt",
    }).populate("MaSach", "TenSach MaSach");

    res.json(requests);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu chờ duyệt:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Duyệt yêu cầu mượn sách
exports.approveRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    // Kiểm tra và cập nhật số lượng sách
    const book = await Book.findById(request.MaSach);
    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    if (book.SoQuyen <= 0) {
      return res
        .status(400)
        .json({ message: "Sách đã hết, không thể duyệt yêu cầu" });
    }

    // Giảm số lượng sách
    book.SoQuyen -= 1;
    await book.save();

    // Cập nhật yêu cầu mượn
    request.TrangThai = "đã duyệt";
    request.NgayMuon = new Date();
    request.NgayHenTra = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await request.save();

    res.json({ message: "Đã duyệt yêu cầu mượn sách", data: request });
  } catch (error) {
    console.error("Lỗi khi duyệt yêu cầu:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Từ chối yêu cầu mượn sách
exports.rejectRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    request.TrangThai = "từ chối";
    await request.save();
    res.json({ message: "Đã từ chối yêu cầu mượn sách" });
  } catch (error) {
    console.error("Lỗi khi từ chối yêu cầu:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Lấy tất cả lịch sử mượn sách (cho staff)
exports.getAllBorrowingHistory = async (req, res) => {
  try {
    const history = await BorrowRequest.find({
      $or: [
        { TrangThai: "đã duyệt" },
        { TrangThai: "đã trả" },
        { TrangThai: "từ chối" },
      ],
    })
      .populate("MaDocGia", "HoTen")
      .populate("MaSach", "MaSach TenSach");

    res.json(history);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử mượn sách:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};

// Xử lý trả sách
exports.returnBook = async (req, res) => {
  try {
    const requestId = req.params.id;
    const borrowRequest = await BorrowRequest.findById(requestId);

    if (!borrowRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu mượn sách" });
    }

    // Kiểm tra xem người dùng có phải là người mượn sách không
    if (borrowRequest.MaDocGia.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền trả sách này" });
    }

    // Kiểm tra trạng thái sách
    if (borrowRequest.TrangThai !== "đã duyệt" || borrowRequest.NgayTra) {
      return res.status(400).json({ message: "Không thể trả sách này" });
    }

    // Tăng số lượng sách
    const book = await Book.findById(borrowRequest.MaSach);
    if (book) {
      book.SoQuyen += 1;
      await book.save();
    }

    // Cập nhật thông tin trả sách
    borrowRequest.TrangThai = "đã trả";
    borrowRequest.NgayTra = new Date();
    await borrowRequest.save();

    res.json({ message: "Đã trả sách thành công", data: borrowRequest });
  } catch (error) {
    console.error("Lỗi khi xử lý trả sách:", error);
    res.status(500).json({ message: "Đã có lỗi xảy ra" });
  }
};
