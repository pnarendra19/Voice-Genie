import { useEffect, useRef } from "react";

// Chat history. Shows a "typing" bubble while waiting for the AI.
export default function ChatWindow({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <main className="chat" id="chat">
      {messages.map((m, i) => (
        <div
          key={m.id ?? i}
          className={`bubble ${m.role} ${m.isError ? "error" : ""}`}
        >
          {m.text}
        </div>
      ))}
      {loading && (
        <div className="bubble ai typing">
          <span /><span /><span />
        </div>
      )}
      <div ref={endRef} />
    </main>
  );
}