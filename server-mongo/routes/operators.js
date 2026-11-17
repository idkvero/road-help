const express = require("express");
const router = express.Router();

const {
  getOperators,
  createOperator,
} = require("../controllers/requestsController");

router.get("/", getOperators);

router.post("/", createOperator);

module.exports = router;
