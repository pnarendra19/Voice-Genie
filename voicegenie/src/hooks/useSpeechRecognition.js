import { useRef, useState } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const UNSUPPORTED_MSG =
  "Speech recognition is not supported in this browser. Please use Chrome or Edge.";

// Turns browser error codes into friendly messages
const ERROR_MESSAGES = {
  "not-allowed": "Microphone permission was denied. Allow mic access in the browser address bar and try again.",
  "service-not-allowed": "Microphone permission was denied. Allow mic access in the browser address bar and try again.",
  "no-speech": "I didn't hear anything. Tap the mic and try again.",
  "audio-capture": "No microphone was found. Please connect one.",
  network: "Network error. Speech recognition needs an internet connection.",
  "language-not-supported": "This language is not supported by your browser.",
};

// Custom hook for speech-to-text.
// lang    -> "en-IN" (English) or "te-IN" (Telugu)
// onFinal -> called with the final recognized text when you stop speaking
export default function useSpeechRecognition({ lang = "en-IN", onFinal }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // live text while speaking
  const [error, setError] = useState(SpeechRecognition ? "" : UNSUPPORTED_MSG);
  const recognitionRef = useRef(null);

  // Keep the latest onFinal without recreating the recognizer
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const start = () => {
    if (!SpeechRecognition) {
      setError(UNSUPPORTED_MSG);
      return;
    }
    setError("");
    setTranscript("");

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = true; // show text while the user is still speaking
    rec.continuous = false;    // stop automatically after a pause
    rec.maxAlternatives = 1;

    let finalText = "";

    rec.onstart = () => setListening(true);

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text;
        else interim += text;
      }
      setTranscript(finalText + interim);
    };

    rec.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(ERROR_MESSAGES[event.error] || `Speech error: ${event.error}`);
    };

    rec.onend = () => {
      setListening(false);
      setTranscript("");
      if (finalText.trim()) onFinalRef.current(finalText.trim());
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError("Could not start the microphone. Please try again.");
    }
  };

  const stop = () => recognitionRef.current?.stop();

  // One function for the mic button: start if idle, stop if listening
  const toggle = () => (listening ? stop() : start());

  return { listening, transcript, error, toggle, stop };
}