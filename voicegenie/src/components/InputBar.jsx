import { useState } from "react";

// Text box + Send button. Keeps its own typing state.
export default function InputBar({ onSend }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="input-row">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Type your message..."
      />
      <button className="send" onClick={handleSend}>
        Send
      </button>
    </div>
  );
}