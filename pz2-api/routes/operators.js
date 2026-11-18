const express = require("express");
const router = express.Router();

const {
  listOperators,
  getOperatorById,
  createOperator,
  updateOperator,
  patchOperator,
  deleteOperator,
  getOperatorRequests,
} = require("../controllers/operatorsController");

router.get("/", listOperators);
router.get("/:id/requests", getOperatorRequests);
router.get("/:id", getOperatorById);
router.post("/", createOperator);
router.put("/:id", updateOperator);
router.patch("/:id", patchOperator);
router.delete("/:id", deleteOperator);

module.exports = router;
