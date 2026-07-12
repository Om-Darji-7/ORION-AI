import { useCallback, useState } from "react";
import Scene from "./components/scene/Scene";
import HUD from "./components/hud/HUD";
import WakeEngine from "./components/igris/WakeEngine";
import VoiceListener from "./components/orion/VoiceListener";

import "./index.css";
import "./styles/hud.css";

export default function App() {
  const [awake, setAwake] = useState<boolean>(false);

  const wakeIgris = useCallback(() => {
    console.log("🟢 IGRIS Activated");
    setAwake(true);
  }, []);

  const sleepIgris = useCallback(() => {
    console.log("😴 IGRIS Sleeping");
    setAwake(false);
  }, []);

  return (
    <div className="app">
      {/* Dynamic 3D Scene Layer */}
      <Scene />

      {/* Core Jarvis Futuristic HUD UI Displays */}
      <HUD />

      {/* Passive Listening Engine Module */}
      {!awake && (
        <WakeEngine onWake={wakeIgris} />
      )}

      {/* Active Conversation Processing Pipeline Layer */}
      {awake && (
        <VoiceListener onSleep={sleepIgris} />
      )}
    </div>
  );
}
