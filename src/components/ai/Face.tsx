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

  useFrame(({ clock }) => {
  if (!group.current) return;

  // 1. Smooth up-down floating wave chalti rahegi bina mouse movement ke
  group.current.position.y = Math.sin(clock.elapsedTime * 0.4) * 0.1;

  // 2. 🔥 MOUSE TRACKING REMOVED:
  // mouse.x aur mouse.y ko poora hata kar dynamic angles ko constant flat values par lock kar diya.
  // Ab face bina kisi shart ke hamesha perfectly stable reh kar right side hi dekhega.
  group.current.rotation.y = Math.PI / 2; // Pure 90-degree perfect side view layout
  group.current.rotation.x = 0;           // Pitch zero straight alignment
});



  return (
  /* 🔥 PRIMITIVE SE POSITION HATA KAR DIRECT GROUP PAR LAGAI FORCED LEFT SHIFT KE LIYE */
  <group 
    ref={group} 
    position={[-11, 0, 0]} // Pura group hi 3D space mein ekdam left chala jayega
    scale={8}              // Scale ko bhi group par daal diya taaki mesh structure control mein rahe
  >
    <primitive
      object={scene}
      // Yahan se scale aur position ko hata kar clean kar diya
      position={[0, 0, 0]} 
    />
  </group>
);
}
