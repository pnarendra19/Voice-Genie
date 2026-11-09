// Listening indicator: animated bars + a status line.
export default function Waveform({ listening, speaking }) {
  const status = listening
    ? "Listening..."
    : speaking
    ? "Speaking..."
    : "Tap the mic to talk";

  return (
    <>
      <div className={`waveform ${listening ? "active" : ""}`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
      <p className="status">{status}</p>
    </>
  );
}