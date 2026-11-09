const mongoose = require("mongoose");

// One document = one message in a conversation.
const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },         // who the conversation belongs to
  conversationId: { type: String, required: true }, // which chat
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },        // user message or AI response
  lang: { type: String },                           // en-IN or te-IN
  createdAt: { type: Date, default: Date.now },     // timestamp
});

// Makes "load this conversation in order" fast
messageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);