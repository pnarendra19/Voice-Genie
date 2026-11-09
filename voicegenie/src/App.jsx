import { useEffect, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import SpeechSettings from "./components/SpeechSettings";
import ChatWindow from "./components/ChatWindow";
import Waveform from "./components/Waveform";
import TranscriptBar from "./components/TranscriptBar";
import InputBar from "./components/InputBar";
import VoiceControls from "./components/VoiceControls";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import { askAI, fetchHistory } from "./services/api";
import { startNewConversation } from "./services/identity";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const WELCOME = {
  id: "welcome",
  role: "ai",
  text: "Hi! I'm VoiceGenie. Tap the mic or type a message.",
};

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [lang, setLang] = useState("en-IN");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const tts = useSpeechSynthesis(lang);

  // Load the saved conversation from MongoDB when the page opens
  useEffect(() => {
    fetchHistory().then((saved) => {
      if (saved.length === 0) return;
      const restored = saved.map((m) => ({
        id: m.id,
        role: m.role === "assistant" ? "ai" : "user",
        text: m.content,
      }));
      setMessages([WELCOME, ...restored]);
    });
  }, []);

  const sendMessage = async (text) => {
    const clean = text.trim();
    if (!clean || loading) return;

    setMessages((prev) => [...prev, { id: newId(), role: "user", text: clean }]);
    setLoading(true);

    try {
      const reply = await askAI(clean, lang); // server adds the saved context
      const aiMessage = { id: newId(), role: "ai", text: reply };
      setMessages((prev) => [...prev, aiMessage]);
      tts.speak(reply, { id: aiMessage.id });
    } catch (err) {
      const text =
        err instanceof TypeError
          ? "Can't reach the server. Is the backend running?"
          : err.message;
      setMessages((prev) => [...prev, { id: newId(), role: "ai", text, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const { listening, transcript, error, toggle } = useSpeechRecognition({
    lang,
    onFinal: sendMessage,
  });

  const handleMic = () => {
    if (!listening) tts.stop();
    toggle();
  };

  const replayLast = () => {
    const last = [...messages].reverse().find((m) => m.role === "ai" && !m.isError);
    if (last) tts.speak(last.text, { id: last.id, force: true });
  };

  // New chat: new conversation id, empty screen
  const handleNewChat = () => {
    tts.stop();
    startNewConversation();
    setMessages([WELCOME]);
  };

  return (
    <div className="app">
      <Navbar
        lang={lang}
        onLangChange={setLang}
        disabled={listening}
        settingsOpen={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
        onNewChat={handleNewChat}
      />

      {showSettings && (
        <SpeechSettings
          supported={tts.supported}
          lang={lang}
          voices={tts.voices}
          selectedVoice={tts.selectedVoice}
          onVoiceChange={tts.setVoice}
          rate={tts.rate}
          onRateChange={tts.setRate}
          onPreview={tts.preview}
        />
      )}

      <ChatWindow messages={messages} loading={loading} />
      <Waveform listening={listening} speaking={tts.speaking} />
      <TranscriptBar transcript={transcript} error={error} />
      <footer className="controls">
        <InputBar onSend={sendMessage} />
        <VoiceControls
          listening={listening}
          onMic={handleMic}
          onSpeak={replayLast}
          onStop={tts.stop}
        />
      </footer>
    </div>
  );
}