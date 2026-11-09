import { useEffect, useRef, useState } from "react";

const synth = window.speechSynthesis;
const supported = Boolean(synth);

// Small helpers to remember the user's voice + speed between visits
const readStore = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

// Long text is spoken sentence by sentence (Chrome can cut off long utterances)
const splitIntoChunks = (text) =>
  text.match(/[^.!?।\n]+[.!?।]*/g)?.map((s) => s.trim()).filter(Boolean) || [text];

const normalize = (lang) => lang.replace("_", "-").toLowerCase();

// Custom hook: text-to-speech with voice choice, speed control and no repeats.
// lang -> "en-IN" or "te-IN" (decides which voices are offered)
export default function useSpeechSynthesis(lang = "en-IN") {
  const langCode = lang.split("-")[0]; // "en" or "te"

  const [allVoices, setAllVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRateState] = useState(() => Number(readStore("vg_rate", "1")) || 1);
  const [voiceMap, setVoiceMap] = useState(() => {
    try {
      return JSON.parse(readStore("vg_voices", "{}"));
    } catch {
      return {};
    }
  });

  const spokenIds = useRef(new Set()); // ids of replies already read aloud
  const token = useRef(0);             // identifies the current speech job

  // 1. Load the voices installed in the browser (they load asynchronously)
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setAllVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // 2. Voices that match the chosen language, and the one currently selected
  const voices = allVoices.filter((v) => normalize(v.lang).startsWith(langCode));
  const selectedVoice =
    voices.find((v) => v.voiceURI === voiceMap[langCode]) ||
    voices.find((v) => normalize(v.lang) === normalize(lang)) ||
    voices[0] ||
    null;

  // Refs so speak() always uses the latest settings, even inside async code
  const langRef = useRef(lang);
  const rateRef = useRef(rate);
  const voiceRef = useRef(selectedVoice);
  langRef.current = lang;
  rateRef.current = rate;
  voiceRef.current = selectedVoice;

  const setVoice = (voiceURI) =>
    setVoiceMap((prev) => {
      const next = { ...prev, [langCode]: voiceURI };
      writeStore("vg_voices", JSON.stringify(next));
      return next;
    });

  const setRate = (value) => {
    setRateState(value);
    writeStore("vg_rate", String(value));
  };

  // 3. Speak. Pass an id so the same reply is never read twice automatically.
  //    force: true is used by the speaker button to deliberately replay.
  const speak = (text, { id, force = false } = {}) => {
    if (!supported || !text) return;

    if (id != null) {
      if (!force && spokenIds.current.has(id)) return; // already spoken: skip
      spokenIds.current.add(id);
    }

    synth.cancel(); // stop anything that is still being spoken
    const myToken = ++token.current;
    const chunks = splitIntoChunks(text);

    chunks.forEach((chunk, i) => {
      const utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = langRef.current;
      if (voiceRef.current) utter.voice = voiceRef.current;
      utter.rate = rateRef.current; // 0.5 = slow, 1 = normal, 2 = fast

      if (i === 0) {
        utter.onstart = () => token.current === myToken && setSpeaking(true);
      }
      const finish = () => {
        if (token.current === myToken && i === chunks.length - 1) setSpeaking(false);
      };
      utter.onend = finish;
      utter.onerror = finish;
      synth.speak(utter);
    });
  };

  // 4. Stop speaking immediately
  const stop = () => {
    if (!supported) return;
    token.current++; // makes old callbacks harmless
    synth.cancel();
    setSpeaking(false);
  };

  // 5. Let the user hear the selected voice and speed
  const preview = () =>
    speak(
      langCode === "te"
        ? "నమస్కారం, నేను వాయిస్ జీనీ."
        : "Hello, I am VoiceGenie. How does this sound?"
    );

  return {
    supported,
    speaking,
    speak,
    stop,
    preview,
    voices,
    selectedVoice,
    setVoice,
    rate,
    setRate,
  };
}