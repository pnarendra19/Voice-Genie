// CLOUD AI: calls the Anthropic API. The key stays here on the server.
async function generateReply(system, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const e = new Error("ANTHROPIC_API_KEY is missing");
    e.userMessage = "The server is missing its AI API key.";
    throw e;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLOUD_MODEL || "claude-haiku-5-5",
      max_tokens: 400,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const e = new Error(`Anthropic ${res.status}: ${await res.text()}`);
    e.userMessage =
      res.status === 401
        ? "The AI API key is invalid."
        : "The AI service had a problem. Please try again.";
    throw e;
  }

  const data = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

module.exports = { generateReply };