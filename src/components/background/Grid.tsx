import { Grid } from "@react-three/drei";

export default function FloorGrid() {
  return (
    <Grid
      position={[0, -3, 0]}
      args={[30, 30]}
      cellSize={0.5}
      cellThickness={0.4}
      cellColor="#00d9ff"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#00ffff"
      fadeDistance={40}
      fadeStrength={1}
      infiniteGrid
    />
  );
}