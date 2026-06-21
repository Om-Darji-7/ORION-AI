import { Stars } from "@react-three/drei";

export default function Space() {
  return (
    <Stars
      radius={120}
      depth={80}
      count={7000}
      factor={5}
      saturation={0}
      fade
      speed={0.6}
    />
  );
}