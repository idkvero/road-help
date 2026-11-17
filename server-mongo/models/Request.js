const mongoose = require("mongoose");

const STATUSES = ["new", "in_progress", "completed"];

const commentSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const statusChangeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    changedBy: {
      type: String,
      default: "system",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const requestSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "Нужно описание проблемы"],
    trim: true,
  },
  location: {
    address: {
      type: String,
      required: [true, "Нужен адрес"],
      trim: true,
    },
    lat: Number,
    lng: Number,
  },
  car: {
    brand: String,
    model: String,
    plate: String,
  },
  tags: [String],
  comments: [commentSchema],
  statusHistory: [statusChangeSchema],
  status: {
    type: String,
    enum: STATUSES,
    default: "new",
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Operator",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

requestSchema.index({ description: "text" });
requestSchema.index({ "location.address": 1 });
requestSchema.index({ tags: 1 });
requestSchema.index({ status: 1, createdAt: -1 });

requestSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

requestSchema.methods.addComment = function (author, text) {
  this.comments.push({ author, text });

  return this.save();
};

requestSchema.methods.changeStatus = function (status, changedBy = "system") {
  this.status = status;
  this.statusHistory.push({ status, changedBy });

  return this.save();
};

requestSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag });
};

requestSchema.statics.findActual = function () {
  return this.find({ status: { $ne: "completed" } }).sort({ createdAt: -1 });
};

requestSchema.set("toJSON", { virtuals: true });

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
module.exports.STATUSES = STATUSES;
