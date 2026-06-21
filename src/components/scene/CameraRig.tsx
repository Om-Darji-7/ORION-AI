import { useFrame, useThree } from "@react-three/fiber";

export default function CameraRig() {
  const { camera, mouse } = useThree();

  useFrame(() => {
    camera.position.x +=
      (mouse.x * 1.5 - camera.position.x) * 0.03;

    camera.position.y +=
      (mouse.y * 0.8 - camera.position.y) * 0.03;

    camera.lookAt(0, 0, 0);
  });

  return null;
}