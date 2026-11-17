const mongoose = require("mongoose");

const operatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: String,
  shift: {
    type: String,
    enum: ["day", "night"],
    default: "day",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Operator = mongoose.model("Operator", operatorSchema);

module.exports = Operator;
