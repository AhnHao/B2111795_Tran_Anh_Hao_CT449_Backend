const mongoose = require("mongoose");
const Book = require("../models/book.model");
const Publisher = require("../models/publisher.model");
const generateCode = require("../utils/generateCode");

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().populate("MaNXB");
    res.json(books);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách sách", error: error.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("MaNXB", "TenNXB");
    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }
    res.json(book);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin sách", error: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { TenSach, TacGia, DonGia, SoQuyen, MaNXB, NamXB, imageUrl } =
      req.body;

    // Tìm publisher bằng MaNXB
    const publisher = await Publisher.findOne({ MaNXB: MaNXB });
    if (!publisher) {
      return res.status(400).json({ message: "Nhà xuất bản không tồn tại" });
    }

    // Tạo mã sách tự động
    const MaSach = await generateCode(Book, "S", "MaSach");

    const newBook = new Book({
      MaSach,
      TenSach,
      TacGia,
      MaNXB: publisher._id,
      NamXB,
      DonGia,
      SoQuyen,
      imageUrl, // Add imageUrl to creation
    });

    await newBook.save();

    // Populate thông tin nhà xuất bản trước khi trả về
    const savedBook = await Book.findById(newBook._id).populate("MaNXB");

    res.status(201).json(savedBook);
  } catch (error) {
    console.error("Error creating book:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi tạo sách mới", error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { TenSach, TacGia, DonGia, SoQuyen, NamXB, imageUrl } = req.body;
    let MaNXB = req.body.MaNXB;
    const bookId = req.params.id;

    // Kiểm tra nhà xuất bản tồn tại nếu có cập nhật MaNXB
    if (MaNXB) {
      const publisher = await Publisher.findOne({ MaNXB });
      if (!publisher) {
        return res.status(400).json({ message: "Nhà xuất bản không tồn tại" });
      }
      MaNXB = publisher._id;
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      { TenSach, TacGia, DonGia, SoQuyen, MaNXB, NamXB, imageUrl }, // Add imageUrl to update
      { new: true }
    ).populate("MaNXB", "TenNXB");

    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    res.json(book);
  } catch (error) {
    console.error("Error updating book:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật sách", error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    // Kiểm tra xem sách có đang được mượn không
    if (book.TheoDoi && book.TheoDoi.MaDocGia) {
      return res
        .status(400)
        .json({ message: "Không thể xóa sách đang được mượn" });
    }

    await book.deleteOne();
    res.json({ message: "Đã xóa sách thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa sách", error: error.message });
  }
};

// Tìm kiếm sách
exports.searchBooks = async (req, res) => {
  try {
    const { keyword } = req.query;
    const searchQuery = {
      $or: [
        { TenSach: { $regex: keyword, $options: "i" } },
        { MaSach: { $regex: keyword, $options: "i" } },
        { TacGia: { $regex: keyword, $options: "i" } },
      ],
    };

    const books = await Book.find(searchQuery).populate("MaNXB", "TenNXB");

    res.json(books);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tìm kiếm sách", error: error.message });
  }
};
