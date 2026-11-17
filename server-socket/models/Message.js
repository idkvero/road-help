const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    index: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ["message", "system"],
    default: "message",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

messageSchema.index({ requestId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
