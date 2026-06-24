import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useOrionStore } from "../../store/orionStore";

export default function AICore() {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    // Direct hardware check: check input if browser is currently talking or user is speaking
    const isUserSpeaking = useOrionStore.getState().voiceActive;
    const isOrionSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
    const anyVoiceActive = isUserSpeaking || isOrionSpeaking;

    // 🚀 VOICE REACTIVE SPEED & ROTATION TURBINE:
    // Standby mood me core slow ghumega, par bolte hi velocity instant scale up ho jayega
    const currentSpeed = anyVoiceActive ? 0.05 : 0.01;
    mesh.current.rotation.y += currentSpeed;
    mesh.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.15;
    mesh.current.position.y = Math.sin(clock.elapsedTime) * 0.15;

    // Dynamic wave expansion calculations
    const pulseFactor = anyVoiceActive ? 0.09 : 0.05;
    const cycleFrequency = anyVoiceActive ? 8 : 1.5;
    const s = 1 + Math.sin(clock.elapsedTime * cycleFrequency) * pulseFactor;

    mesh.current.scale.set(s, s, s);
  });

  return (
    <group> 
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 32]} />

        {/* Material distortion dynamically links up to your active speech status flags */}
        <MeshDistortMaterial
          color="#00d9ff"
          emissive="#00d9ff"
          emissiveIntensity={5.8}
          distort={0.35}
          speed={2}
          roughness={0}
          metalness={1}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
