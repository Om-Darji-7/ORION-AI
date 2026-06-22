import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

export default function Face() {
  const { scene } = useGLTF("/models/face.glb");
  const group = useRef<THREE.Group>(null!);

  // Do alag materials create karenge: ek lines ke liye aur ek dots ke liye
  const { lineMat, pointMat } = useMemo(() => {
    const line = new THREE.MeshBasicMaterial({
      color: "#a4f4ff",       // Light bright cyan color
      wireframe: true,
      transparent: true,
      opacity: 0.12,          // Soft layout lines background mein
      blending: THREE.AdditiveBlending,
    });

    const point = new THREE.PointsMaterial({
      color: "#ffffff",       // Pure white shiny nodes junctions par
      size: 0.025,            // Dots ka size ekdam sharp aur chota rakhna hai
      transparent: true,
      opacity: 0.85,          // Junction points ko zyada visible aur bright rakha
      sizeAttenuation: true,  // Door jaane par dots chhote honge aur paas aane par bade
      blending: THREE.AdditiveBlending,
    });

    return { lineMat: line, pointMat: point };
  }, []);

  useEffect(() => {
    // Model ke meshes ko trace karke structural points create karenge
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        
        // 1. Base mesh par structural wireframe lines apply karo
        mesh.material = lineMat;

        // 2. Usi geometry se technical points array nodes clone karo
        const points = new THREE.Points(mesh.geometry, pointMat);
        points.scale.copy(mesh.scale);
        points.position.copy(mesh.position);
        points.rotation.copy(mesh.rotation);
        
        // Is node structure ko original mesh ke child ki tarah inject kar do
        mesh.add(points);
      }
    });
  }, [scene, lineMat, pointMat]);

  useFrame(({ clock, mouse }) => {
    if (!group.current) return;

    // Up-Down Floating animation
    group.current.position.y = Math.sin(clock.elapsedTime) * 0.15;

    // Mouse movement rotation
    group.current.rotation.y += 0.001;
    group.current.rotation.x = -mouse.y * 0.2;
  });

  return (
    <group ref={group}>
      <primitive
        object={scene}
        scale={3} // Aapka purana perfect size layout matrix
        position={[0, 0, 0]}
      />
    </group>
  );
}
