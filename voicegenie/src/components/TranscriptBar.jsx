// Shows the live recognized text while speaking, and any error message.
export default function TranscriptBar({ transcript, error }) {
  if (!transcript && !error) return null;
  return (
    <div className={`transcript ${error ? "error" : ""}`}>
      {error || transcript}
    </div>
  );
}