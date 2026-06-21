import Scene from "./components/scene/Scene";
import HUD from "./components/hud/HUD";
import "./index.css";
import "./styles/hud.css";

export default function App() {
  return (
    <div className="app">
      <Scene />
      <HUD />
    </div>
  );
}