// Top bar: logo, language selector, voice settings and new chat.
export default function Navbar({
  lang,
  onLangChange,
  disabled,
  settingsOpen,
  onToggleSettings,
  onNewChat,
}) {
  return (
    <header className="navbar">
      <div className="logo">🧞 VoiceGenie</div>
      <nav>
        <select
          className="lang"
          value={lang}
          onChange={(e) => onLangChange(e.target.value)}
          disabled={disabled}
          title="Speech language"
        >
          <option value="en-IN">English</option>
          <option value="te-IN">తెలుగు</option>
        </select>
        <button
          className={`nav-btn ${settingsOpen ? "active" : ""}`}
          onClick={onToggleSettings}
        >
          ⚙ Voice
        </button>
        <button className="nav-btn" onClick={onNewChat} title="Start a new conversation">
          ＋ New
        </button>
      </nav>
    </header>
  );
}