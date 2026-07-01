import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Neural() {
  const group = useRef<THREE.Group>(null!);

  const { nodes, lines } = useMemo(() => {
    const COUNT = 320; // Count thoda optimize kiya taaki performance bani rahe aur center load kam ho

    const positions: number[] = [];

    for (let i = 0; i < COUNT; i++) {
      positions.push(
        (Math.random() - 0.5) * 40, // X-axis (Width): 12 se badha kar 35 kiya taaki left/right door tak phaile
        (Math.random() - 0.5) * 20, // Y-axis (Height): Isko 14 kiya taaki upar-neeche zyada dense na ho
        (Math.random() - 0.5) * 20  // Z-axis (Depth): Isko 16 rakha background depth ke liye
      );
    }

    const linePositions: number[] = [];

    for (let i = 0; i < COUNT; i++) {
      const ax = positions[i * 3];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];

      for (let j = i + 1; j < COUNT; j++) {
        const bx = positions[j * 3];
        const by = positions[j * 3 + 1];
        const bz = positions[j * 3 + 2];

        const dist = Math.sqrt(
          (ax - bx) ** 2 +
          (ay - by) ** 2 +
          (az - bz) ** 2
        );

        // Distance threshold ko badhaya taaki door door waale nodes bhi aapas mein connect ho sakein left-right mein
        if (dist < 3.8) {
          linePositions.push(
            ax, ay, az,
            bx, by, bz
          );
        }
      }
    }

    return {
      nodes: new Float32Array(positions),
      lines: new Float32Array(linePositions),
    };
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.15) * 0.05;
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.15;
  });

  return (
    // position={[0, 0, -5]} lagane se ye core ke peeche background mesh ban jayega aur overlay nahi karega
    <group ref={group} position={[0, 0, 1]}>
      {/* Nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nodes, 3]}
          />
        </bufferGeometry>

        <pointsMaterial
          color="#4fd8ff"
          size={0.06} // Dots ka size thoda normal kiya taaki clean futuristic look aaye
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connections */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[lines, 3]}
          />
        </bufferGeometry>

        <lineBasicMaterial
          color="#00d9ff"
          transparent
          opacity={0.12} // Pehle 0.25 tha, bloom ke sath 0.12 bohot dynamic aur sophisticated lagta hai
          blending={THREE.AdditiveBlending} // Lines ke merge hone par glowing knots banenge
        />
      </lineSegments>
    </group>
  );
}
