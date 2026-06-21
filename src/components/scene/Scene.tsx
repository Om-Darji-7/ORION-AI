import { Canvas } from "@react-three/fiber";
import Particles from "../background/Particles";
import Neural from "../background/Neural";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import AICore from "../ai/AICore";
import FloorGrid from "../background/Grid";
import Space from "../background/Stars";
import CameraRig from "./CameraRig";
import AIHalo from "../ai/AIHalo";
import OrbitRings from "../ai/OrbitRings";
import EnergyPulse from "../ai/EnergyPulse";
import ScanBeam from "../ai/ScanBeam";
import AuraParticles from "../ai/AuraParticles";
import ScannerSweep from "../ai/ScannerSweep";
import Face from "../ai/Face";

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 35 }}
    >
      <color attach="background" args={["#02030a"]} />
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#02030a", 10, 35]} />
      
      <ambientLight intensity={3} />


       <pointLight
        position={[0, 0, 5]}
        intensity={1}
        />

       <pointLight
         position={[0,0,0]}
         intensity={12}
         color="#00d9ff"
       />
       
       <pointLight
         position={[0,5,5]}
         intensity={3}
         color="#ffffff"
       />

      <Space />
      <CameraRig />
      <Particles />
      <Neural />
      <Face />
      <AICore />
      <AuraParticles />
      <ScannerSweep />
      <AIHalo />
      <OrbitRings />
      <EnergyPulse />
      <ScanBeam />
      <FloorGrid />
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0}
          luminanceSmoothing={0.8}
        />
        </EffectComposer>
    </Canvas>
    
  );
}