const express = require("express");
const router = express.Router();

const {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
  patchRequest,
  deleteRequest,
  changeStatus,
  assignOperator,
} = require("../controllers/requestsController");

router.get("/", listRequests);
router.get("/:id", getRequestById);
router.post("/", createRequest);
router.put("/:id", updateRequest);
router.patch("/:id/status", changeStatus);
router.patch("/:id/operator", assignOperator);
router.patch("/:id", patchRequest);
router.delete("/:id", deleteRequest);

module.exports = router;
