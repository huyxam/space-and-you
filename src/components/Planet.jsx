import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Ring, Sphere } from "@react-three/drei";
import * as THREE from "three";

export default function Planet() {
  const planetRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (planetRef.current) {
      planetRef.current.rotation.y = t * 0.15;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.0015;
    }
  });

  return (
    <group position={[0, 0.15, 0]}>
      <Sphere args={[3.25, 64, 64]}>
        <meshBasicMaterial
          color="#8a67ff"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      <Sphere args={[2.45, 64, 64]}>
        <meshBasicMaterial
          color="#ffb86b"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      <Sphere ref={planetRef} args={[1.85, 128, 128]}>
        <meshPhysicalMaterial
          color="#59386d"
          emissive="#ff96ec"
          emissiveIntensity={1.05}
          roughness={0.28}
          metalness={0.08}
          clearcoat={0.86}
          clearcoatRoughness={0.18}
        />
      </Sphere>

      <Ring
        ref={ringRef}
        args={[2.28, 4.35, 160]}
        rotation={[Math.PI / 2.38, 0, 0]}
      >
        <meshBasicMaterial
          color="#ff7eb6"
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <Ring
        args={[2.06, 2.22, 160]}
        rotation={[Math.PI / 2.38, 0, 0]}
      >
        <meshBasicMaterial
          color="#7c4dff"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <Ring
        args={[4.5, 4.68, 160]}
        rotation={[Math.PI / 2.38, 0, 0]}
      >
        <meshBasicMaterial
          color="#d68cff"
          transparent
          opacity={0.13}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <Ring
        args={[3.08, 3.18, 160]}
        rotation={[Math.PI / 2.38, 0, 0]}
      >
        <meshBasicMaterial
          color="#ffb86b"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <pointLight
        color="#ff7eb6"
        intensity={10.5}
        distance={34}
      />

      <pointLight
        color="#7c4dff"
        intensity={2.6}
        distance={28}
      />

      <pointLight
        color="#ffb86b"
        intensity={2.8}
        distance={18}
      />
    </group>
  );
}
