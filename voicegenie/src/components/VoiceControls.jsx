// Bottom button row: Speaker (🔊), big Microphone (🎤), Stop (⏹).
export default function VoiceControls({ listening, onMic, onSpeak, onStop }) {
  return (
    <div className="button-row">
      <button className="icon-btn" onClick={onSpeak} title="Speak last reply">
        🔊
      </button>
      <button
        className={`mic ${listening ? "on" : ""}`}
        onClick={onMic}
        title="Microphone"
      >
        🎤
      </button>
      <button className="icon-btn" onClick={onStop} title="Stop speaking">
        ⏹
      </button>
    </div>
  );
}