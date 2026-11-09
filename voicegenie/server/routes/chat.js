const express = require("express");
const ollama = require("../services/ollama");
const anthropic = require("../services/anthropic");
const { loadHistory, saveExchange, getConversation } = require("../services/memory");

const router = express.Router();

const ID_RE = /^[\w-]{8,64}$/; // ids made by the browser (uuid)
const validIds = (userId, conversationId) =>
  ID_RE.test(userId || "") && ID_RE.test(conversationId || "");

function getProvider() {
  return process.env.AI_PROVIDER === "cloud" ? anthropic : ollama;
}

// Current date/time in the USER's time zone (AI models don't know the time)
function getNow(timeZone) {
  const options = { dateStyle: "full", timeStyle: "short" };
  try {
    return new Date().toLocaleString("en-IN", { ...options, timeZone });
  } catch {
    return new Date().toLocaleString("en-IN", { ...options, timeZone: "Asia/Kolkata" });
  }
}

function buildSystemPrompt(lang, timeZone) {
  const languageRule =
    lang === "te-IN"
      ? "Always reply in Telugu using Telugu script, even if the user writes in English. Use simple, short sentences."
      : "Always reply in English.";

  return `You are VoiceGenie, a friendly voice assistant.
Your name is "VoiceGenie". In Telugu, write your name as "వాయిస్ జీనీ".
The user's current date and time is: ${getNow(timeZone)}.
Use it when asked about the time, date or day.
If you do not know something (live weather, news, prices), say so honestly instead of guessing.
Remember what the user told you earlier in this conversation and use it.
Your replies are read aloud, so:
- Keep answers short (1 to 3 sentences) unless the user asks for detail.
- Use plain sentences only: no markdown, bullet points, emojis or code blocks.
${languageRule}`;
}

// The conversation sent to the AI must start with a user message.
function cleanHistory(history) {
  const msgs = history.slice(-6).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 2000),
  }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return msgs;
}

// POST /api/chat
// body: { message, lang, timeZone, userId, conversationId }
router.post("/", async (req, res) => {
  const { message, lang, timeZone, userId, conversationId } = req.body;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  const memoryOn = validIds(userId, conversationId);
  const userTime = new Date();
  const userText = message.trim().slice(0, 2000);

  try {
    // 1. Load earlier messages of this conversation from MongoDB
    let previous = [];
    if (memoryOn) {
      try {
        previous = await loadHistory(userId, conversationId);
      } catch (err) {
        console.error("Memory load failed:", err.message);
      }
    }

    // 2. Ask the AI with that context
    const messages = [...cleanHistory(previous), { role: "user", content: userText }];
    const reply = await getProvider().generateReply(
      buildSystemPrompt(lang, timeZone),
      messages
    );

    // 3. Save both messages (don't make the user wait for this)
    if (memoryOn) {
      saveExchange({ userId, conversationId, userText, userTime, aiText: reply, lang }).catch(
        (err) => console.error("Memory save failed:", err.message)
      );
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    res
      .status(500)
      .json({ error: err.userMessage || "Something went wrong. Please try again." });
  }
});

// GET /api/chat/history?userId=...&conversationId=...
router.get("/history", async (req, res) => {
  const { userId, conversationId } = req.query;
  if (!validIds(userId, conversationId)) return res.json({ messages: [] });

  try {
    res.json({ messages: await getConversation(userId, conversationId) });
  } catch (err) {
    console.error("History error:", err.message);
    res.json({ messages: [] });
  }
});

module.exports = router;