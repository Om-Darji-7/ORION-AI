import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber"; // Added useFrame import
import { useEffect, useRef } from "react"; // Added useRef import
import * as THREE from "three";

export default function Face() {
  const { scene } = useGLTF("/models/face.glb");
  
  // 1. Ref yahan add karo group control karne ke liye
  const group = useRef<THREE.Group>(null!);

  // 2. Tumhara material badalne wala code (Ussi jagah rahega)
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#00d9ff",
          emissive: "#00d9ff",
          emissiveIntensity: 5,
          wireframe: true,
          transparent: true,
          opacity: 0.1,
        });
      }
    });
  }, [scene]);

  // 3. Animation wala code yahan add karo component ke andar
  useFrame(({ clock, mouse }) => {
    if (!group.current) return;

    // Up-Down Floating animation
    group.current.position.y = Math.sin(clock.elapsedTime) * 0.15;

    // Mouse movement rotation
    group.current.rotation.y = mouse.x * 0.4;
    group.current.rotation.x = -mouse.y * 0.2;
  });

  // 4. Return statement mein primitive ko group ke andar daal do
  return (
    <group ref={group}>
      <primitive
        object={scene}
        scale={3}
        position={[0, 0, 0]}
      />
    </group>
  );
}
