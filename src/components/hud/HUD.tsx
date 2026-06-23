import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import BottomPanel from "./BottomPanel";
import Radar from "./Radar";
import Corners from "./Corners";
import VoiceRing from "./VoiceRing";
import DataCard from "./DataCard";

export default function HUD() {
  return (
    <>
      <TopBar />
      <LeftPanel />
      <RightPanel />
      <BottomPanel />
      <Radar />
      
      <Corners />

      <DataCard
        title="NEURAL LINK"
        value="CONNECTED"
        top={220}
        left={50}
      />

      <DataCard
        title="VOICE"
        value="READY"
        top={220}
        right={50}
      />

      <DataCard
        title="SECURITY"
        value="ACTIVE"
        top={320}
        left={50}
      />

      <DataCard
        title="MEMORY"
        value="ONLINE"
        top={320}
        right={50}
      />
    </>
  );
}