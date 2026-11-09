// LOCAL AI: talks to Ollama running on your own computer.
const base = () => process.env.OLLAMA_URL || "http://localhost:11434";
const model = () => process.env.OLLAMA_MODEL || "llama3.2";
const keepAlive = () => process.env.OLLAMA_KEEP_ALIVE || "30m";

async function generateReply(system, messages) {
  const started = Date.now();

  let res;
  try {
    res = await fetch(`${base()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model(),
        stream: false,
        keep_alive: keepAlive(), // keep the model in memory between messages
        options: {
          num_predict: Number(process.env.OLLAMA_MAX_TOKENS) || 300, // cap reply length
        },
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
  } catch {
    const e = new Error("Cannot reach Ollama");
    e.userMessage = "Ollama is not running. Start it and try again.";
    throw e;
  }

  if (!res.ok) {
    const e = new Error(`Ollama ${res.status}: ${await res.text()}`);
    e.userMessage = `Ollama error. Have you run: ollama pull ${model()} ?`;
    throw e;
  }

  const data = await res.json();

  // Timing log: shows exactly where the time goes
  const total = ((Date.now() - started) / 1000).toFixed(1);
  const load = ((data.load_duration || 0) / 1e9).toFixed(1);
  const speed =
    data.eval_count && data.eval_duration
      ? (data.eval_count / (data.eval_duration / 1e9)).toFixed(1)
      : "?";
  console.log(
    `Ollama: ${total}s total | model load ${load}s | ${data.eval_count} tokens at ${speed} tokens/s`
  );

  return data.message.content.trim();
}

// Loads the model into memory when the server starts, so the first message isn't slow.
async function warmUp() {
  try {
    await fetch(`${base()}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model(), keep_alive: keepAlive() }),
    });
    console.log(`Ollama model "${model()}" preloaded`);
  } catch {
    console.log("Ollama not reachable yet (warm-up skipped)");
  }
}

module.exports = { generateReply, warmUp };