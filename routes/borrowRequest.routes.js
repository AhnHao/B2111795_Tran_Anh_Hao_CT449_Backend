const express = require("express");
const router = express.Router();
const borrowRequestController = require("../controllers/borrowRequest.controller");
const authJwt = require("../middleware/auth.jwt");

// Routes cho độc giả
router.get(
  "/my-borrowing",
  [authJwt.verifyToken, authJwt.isReader],
  borrowRequestController.getMyBorrowingBooks
);
router.get(
  "/my-history",
  [authJwt.verifyToken, authJwt.isReader],
  borrowRequestController.getMyBorrowingHistory
);
router.get(
  "/my-pending",
  [authJwt.verifyToken, authJwt.isReader],
  borrowRequestController.getMyPendingRequests
);
router.post(
  "/request",
  [authJwt.verifyToken, authJwt.isReader],
  borrowRequestController.requestBorrow
);
router.post(
  "/:id/return",
  [authJwt.verifyToken, authJwt.isReader],
  borrowRequestController.returnBook
);

// Routes cho staff
router.get(
  "/pending",
  [authJwt.verifyToken, authJwt.isStaff],
  borrowRequestController.getPendingRequests
);
router.get(
  "/all-history",
  [authJwt.verifyToken, authJwt.isStaff],
  borrowRequestController.getAllBorrowingHistory
);
router.post(
  "/:id/approve",
  [authJwt.verifyToken, authJwt.isStaff],
  borrowRequestController.approveRequest
);
router.post(
  "/:id/reject",
  [authJwt.verifyToken, authJwt.isStaff],
  borrowRequestController.rejectRequest
);

module.exports = router;
