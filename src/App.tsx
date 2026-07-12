import { useCallback, useState } from "react";

import Scene from "./components/scene/Scene";
import HUD from "./components/hud/HUD";
import WakeEngine from "./components/igris/WakeEngine";
import SpeechLanguageSelector from "./components/igris/SpeechLanguageSelector";
import VoiceListener from "./components/orion/VoiceListener";

import "./index.css";
import "./styles/hud.css";

export default function App() {
  const [awake, setAwake] = useState(false);

  const [speechLanguage, setSpeechLanguage] = useState(() => {
    return localStorage.getItem("igris-speech-language") || "en-IN";
  });

  const wakeIgris = useCallback(() => {
    console.log("🟢 IGRIS Activated");
    setAwake(true);
  }, []);

  const sleepIgris = useCallback(() => {
    console.log("😴 IGRIS Sleeping");
    setAwake(false);
  }, []);

  const changeSpeechLanguage = useCallback((language: string) => {
    localStorage.setItem("igris-speech-language", language);
    setSpeechLanguage(language);

    console.log("🌐 Speech language changed:", language);
  }, []);

  return (
    <div className="app">
      <Scene />

      <HUD />

      <SpeechLanguageSelector
        value={speechLanguage}
        onChange={changeSpeechLanguage}
      />

      {!awake && (
        <WakeEngine
          language={speechLanguage}
          onWake={wakeIgris}
        />
      )}

      {awake && (
        <VoiceListener
          language={speechLanguage}
          onSleep={sleepIgris}
        />
      )}
    </div>
  );
}