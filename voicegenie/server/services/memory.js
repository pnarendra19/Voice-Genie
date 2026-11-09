const mongoose = require("mongoose");
const Message = require("../models/Message");

const isConnected = () => mongoose.connection.readyState === 1;

// The most recent messages of a conversation, oldest first (sent to the AI as context)
async function loadHistory(userId, conversationId, limit = 6) {
  if (!isConnected()) return [];
  const docs = await Message.find({ userId, conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.reverse().map((d) => ({ role: d.role, content: d.content }));
}

// Saves the user's message and the AI's reply together
async function saveExchange({ userId, conversationId, userText, userTime, aiText, lang }) {
  if (!isConnected()) return;
  await Message.insertMany([
    { userId, conversationId, role: "user", content: userText, lang, createdAt: userTime },
    { userId, conversationId, role: "assistant", content: aiText, lang, createdAt: new Date() },
  ]);
}

// Full conversation for showing in the chat window after a page refresh
async function getConversation(userId, conversationId, limit = 100) {
  if (!isConnected()) return [];
  const docs = await Message.find({ userId, conversationId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
  return docs.map((d) => ({
    id: String(d._id),
    role: d.role,
    content: d.content,
    createdAt: d.createdAt,
  }));
}

module.exports = { loadHistory, saveExchange, getConversation };