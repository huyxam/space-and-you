import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

function noise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function ShootingStar({ data }) {
  const group = useRef();

  useFrame((state, delta) => {
    if (!group.current) return;

    group.current.position.x += data.speed * delta;
    group.current.position.y -= data.speed * delta * 0.28;

    if (group.current.position.x > 34 || group.current.position.y < -13) {
      const cycle = Math.floor(state.clock.elapsedTime / 4) + data.index * 17;
      group.current.position.x = -32 - noise(cycle + 1) * 8;
      group.current.position.y = 8 + noise(cycle + 2) * 11;
      group.current.position.z = (noise(cycle + 3) - 0.5) * 38;
    }
  });

  return (
    <group ref={group} position={data.position} rotation={[0, 0, -0.34]}>
      <mesh position={[-1.3, 0, 0]}>
        <planeGeometry args={[2.8, 0.045]} />
        <meshBasicMaterial
          color="#b8a7ff"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#ffb3cf" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function ShootingStars() {
  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => ({
      index,
      position: [
        -30 + noise(index * 3 + 1) * 8,
        4 + noise(index * 5 + 2) * 14,
        (noise(index * 7 + 3) - 0.5) * 36,
      ],
      speed: 4.8 + noise(index * 11 + 4) * 3.2,
    }));
  }, []);

  return (
    <>
      {stars.map((star) => (
        <ShootingStar key={star.index} data={star} />
      ))}
    </>
  );
}
