const express = require("express");
const router = express.Router();

const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
} = require("../controllers/requestsController");
const { auth, isAdmin } = require("../middleware/auth");

router.get("/", getAllRequests);

router.get("/:id", getRequestById);

router.post("/", createRequest);

router.put("/:id", updateRequest);

router.delete("/:id", auth, isAdmin, deleteRequest);

module.exports = router;
