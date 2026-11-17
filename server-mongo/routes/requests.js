const express = require("express");
const router = express.Router();

const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  addComment,
  updateComment,
  deleteComment,
  changeStatus,
  addTag,
  removeTag,
  getStats,
  getRequestsByTag,
  assignOperator,
} = require("../controllers/requestsController");

router.get("/", getAllRequests);

router.get("/stats", getStats);

router.get("/tag/:tag", getRequestsByTag);

router.get("/:id", getRequestById);

router.post("/", createRequest);

router.put("/:id", updateRequest);

router.patch("/:id/status", changeStatus);

router.patch("/:id/operator", assignOperator);

router.post("/:id/comments", addComment);

router.patch("/:id/comments/:commentId", updateComment);

router.delete("/:id/comments/:commentId", deleteComment);

router.post("/:id/tags", addTag);

router.delete("/:id/tags/:tag", removeTag);

router.delete("/:id", deleteRequest);

module.exports = router;
