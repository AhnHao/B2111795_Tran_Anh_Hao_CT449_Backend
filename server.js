const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

// Import routes
const authRoutes = require("./routes/auth.routes");
const staffRoutes = require("./routes/staff.routes");
const readerRoutes = require("./routes/reader.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRequestRoutes = require("./routes/borrowRequest.routes");
const publisherRoutes = require("./routes/publisher.routes");

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/readers", readerRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/publisher", publisherRoutes);
app.use("/api/borrow-requests", borrowRequestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    message: "Đã xảy ra lỗi!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).send({ message: "Route không tồn tại!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
