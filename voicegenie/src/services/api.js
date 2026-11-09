
import { getUserId, getConversationId } from "./identity";

// ==========================================
// API CONFIGURATION
// ==========================================

// Development: Uses Vite proxy when VITE_API_URL is empty.
// Production: Set VITE_API_URL to your deployed backend URL.

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// ==========================================
// SEND MESSAGE TO AI
// ==========================================

export async function askAI(message, lang = "en") {
  try {
    // 1. Validate message
    if (typeof message !== "string" || !message.trim()) {
      throw new Error("Please enter a message.");
    }

    // 2. Get user's timezone
    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    // 3. Get user and conversation IDs
    const userId = getUserId();
    const conversationId = getConversationId();

    if (!userId || !conversationId) {
      throw new Error("User or conversation ID is missing.");
    }

    // 4. Prepare request body
    const requestBody = {
      message: message.trim(),
      lang,
      timeZone,
      userId,
      conversationId,
    };

    // 5. Send request to Express backend
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(requestBody),
    });

    // 6. Read backend response
    const data = await res.json().catch(() => ({}));

    // 7. Handle HTTP errors
    if (!res.ok) {
      throw new Error(
        data.error || `Server error (${res.status}). Please try again.`
      );
    }

    // 8. Validate AI response
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("Invalid response received from AI server.");
    }

    // 9. Return AI response
    return data.reply;

  } catch (error) {
    console.error("AI Service Error:", error);

    throw error;
  }
}


// ==========================================
// FETCH CHAT HISTORY FROM MONGODB
// ==========================================

export async function fetchHistory() {
  try {
    // 1. Get user and conversation IDs
    const userId = getUserId();
    const conversationId = getConversationId();

    if (!userId || !conversationId) {
      return [];
    }

    // 2. Prepare query parameters
    const params = new URLSearchParams({
      userId,
      conversationId,
    });

    // 3. Fetch conversation history
    const res = await fetch(
      `${API_BASE}/api/chat/history?${params.toString()}`
    );

    // 4. Handle response
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.error || "Unable to load chat history."
      );
    }

    // 5. Return saved messages
    if (!Array.isArray(data.messages)) {
      return [];
    }

    return data.messages;

  } catch (error) {
    console.error("Fetch History Error:", error);

    return [];
  }
}
