const Publisher = require("../models/publisher.model");
const Book = require("../models/book.model");
const generateCode = require("../utils/generateCode");

exports.getAllPublishers = async (req, res) => {
  try {
    const publishers = await Publisher.find();
    res.json(publishers);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Lỗi khi lấy danh sách nhà xuất bản",
        error: error.message,
      });
  }
};

exports.getPublisherById = async (req, res) => {
  try {
    const publisher = await Publisher.findById(req.params.id);
    if (!publisher) {
      return res.status(404).json({ message: "Không tìm thấy nhà xuất bản" });
    }
    res.json(publisher);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Lỗi khi lấy thông tin nhà xuất bản",
        error: error.message,
      });
  }
};

exports.createPublisher = async (req, res) => {
  try {
    const { TenNXB, DiaChi } = req.body;

    // Tạo mã nhà xuất bản tự động
    const MaNXB = await generateCode(Publisher, "NXB", "MaNXB");

    const newPublisher = new Publisher({
      MaNXB,
      TenNXB,
      DiaChi,
    });

    await newPublisher.save();
    res.status(201).json(newPublisher);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo nhà xuất bản mới", error: error.message });
  }
};

exports.updatePublisher = async (req, res) => {
  try {
    const { TenNXB, DiaChi } = req.body;
    const publisherId = req.params.id;

    const publisher = await Publisher.findByIdAndUpdate(
      publisherId,
      { TenNXB, DiaChi },
      { new: true }
    );

    if (!publisher) {
      return res.status(404).json({ message: "Không tìm thấy nhà xuất bản" });
    }

    res.json(publisher);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật nhà xuất bản", error: error.message });
  }
};

exports.deletePublisher = async (req, res) => {
  try {
    const publisherId = req.params.id;

    // Kiểm tra xem có sách nào của nhà xuất bản này không
    const existingBooks = await Book.findOne({ MaNXB: publisherId });
    if (existingBooks) {
      return res.status(400).json({
        message: "Không thể xóa nhà xuất bản này vì đang có sách liên quan",
      });
    }

    const publisher = await Publisher.findByIdAndDelete(publisherId);
    if (!publisher) {
      return res.status(404).json({ message: "Không tìm thấy nhà xuất bản" });
    }

    res.json({ message: "Đã xóa nhà xuất bản thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa nhà xuất bản", error: error.message });
  }
};

// Lấy danh sách sách của nhà xuất bản
exports.getPublisherBooks = async (req, res) => {
  try {
    const publisherId = req.params.id;
    const books = await Book.find({ MaNXB: publisherId });

    res.json(books);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sách của nhà xuất bản",
      error: error.message,
    });
  }
};

exports.searchPublishers = async (req, res) => {
  try {
    const { keyword } = req.query;
    const searchQuery = {
      $or: [
        { TenNXB: { $regex: keyword, $options: "i" } },
        { MaNXB: { $regex: keyword, $options: "i" } },
        { DiaChi: { $regex: keyword, $options: "i" } },
      ],
    };

    const publishers = await Publisher.find(searchQuery);

    res.json(publishers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tìm kiếm nhà xuất bản", error: error.message });
  }
};
