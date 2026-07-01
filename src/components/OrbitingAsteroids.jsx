import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function OrbitingAsteroids() {
  const groupRef = useRef();

  const positions = useMemo(() => {
    const points = [];
    const count = 900;

    for (let i = 0; i < count; i++) {
      const radius = 14 + Math.random() * 18;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6;

      points.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
    }

    return new Float32Array(points);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.16;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>

        <pointsMaterial
          size={0.18}
          color="#ffd4ff"
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
