// Panel to choose the voice, change the speed and preview the sound.
export default function SpeechSettings({
  supported,
  lang,
  voices,
  selectedVoice,
  onVoiceChange,
  rate,
  onRateChange,
  onPreview,
}) {
  if (!supported) {
    return (
      <div className="settings">
        Text-to-speech is not supported in this browser. Please use Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="settings">
      <label>
        Voice
        <select
          value={selectedVoice?.voiceURI || ""}
          onChange={(e) => onVoiceChange(e.target.value)}
          disabled={voices.length === 0}
        >
          {voices.length === 0 && <option value="">Default voice</option>}
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </label>

      {voices.length === 0 && (
        <p className="hint">
          No {lang.startsWith("te") ? "Telugu" : "matching"} voice is installed on this
          device, so the browser's default voice is used and may not read it correctly.
        </p>
      )}

      <label>
        Speed: {rate.toFixed(1)}x
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => onRateChange(Number(e.target.value))}
        />
      </label>

      <button className="preview-btn" onClick={onPreview}>
        ▶ Preview voice
      </button>
    </div>
  );
}