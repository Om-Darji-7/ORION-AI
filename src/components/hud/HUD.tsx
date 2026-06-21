import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import BottomPanel from "./BottomPanel";
import Radar from "./Radar";
import Waveform from "./Waveform";
import Corners from "./Corners";

export default function HUD() {
  return (
    <>
      <TopBar />
      <LeftPanel />
      <RightPanel />
      <BottomPanel />
      <Radar />
      <Waveform />
        <Corners />
    </>
  );
}