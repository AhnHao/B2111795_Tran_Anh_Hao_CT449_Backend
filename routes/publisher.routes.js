const express = require("express");
const router = express.Router();
const publisherController = require("../controllers/publisher.controller");
const authJwt = require("../middleware/auth.jwt");

// Middleware kiểm tra quyền nhân viên
const isStaff = (req, res, next) => {
  if (req.user && req.user.role === "staff") {
    next();
  } else {
    res.status(403).json({ message: "Không có quyền truy cập" });
  }
};

// Routes công khai - ai cũng có thể xem
router.get("/", publisherController.getAllPublishers);
router.get("/:id", publisherController.getPublisherById);
router.get("/:id/books", publisherController.getPublisherBooks);
router.get("/search", publisherController.searchPublishers);

// Routes yêu cầu quyền nhân viên
router.post(
  "/",
  [authJwt.verifyToken, isStaff],
  publisherController.createPublisher
);
router.put(
  "/:id",
  [authJwt.verifyToken, isStaff],
  publisherController.updatePublisher
);
router.delete(
  "/:id",
  [authJwt.verifyToken, isStaff],
  publisherController.deletePublisher
);

module.exports = router;
