import { Billboard } from "@react-three/drei";

export default function AIHalo() {
  return (
    <Billboard>
      <mesh>
        <ringGeometry args={[1.7, 1.8, 64]} />
        <meshBasicMaterial
          color="#00d9ff"
          transparent
          opacity={0.35}
        />
      </mesh>
    </Billboard>
  );
}