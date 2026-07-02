import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

function noise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function Heart({ data, texture }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;

    const t = state.clock.elapsedTime;
    const angle = data.angle + t * data.speed;
    const pulse = Math.sin(t * 1.8 + data.offset) * 0.08;

    ref.current.position.x = Math.cos(angle) * data.xRadius;
    ref.current.position.y = data.y + Math.sin(t * 0.9 + data.offset) * 0.18;
    ref.current.position.z = Math.sin(angle) * data.zRadius;
    ref.current.scale.setScalar(data.scale + pulse);
  });

  return (
    <sprite ref={ref} position={data.position} scale={data.scale}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.82}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

export default function FloatingHearts() {
  const texture = useLoader(TextureLoader, "/textures/heart.png?v=2");

  const hearts = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const layer = index % 3;
      const angle = (index / 12) * Math.PI * 2 + layer * 0.34;
      const radius = 6.8 + layer * 3.2 + (noise(index + 1) - 0.5) * 1.3;

      return {
        angle,
        xRadius: radius,
        zRadius: radius,
        y: (noise(index + 3) - 0.5) * 2.2,
        speed: 0.035 + layer * 0.012,
        scale: 0.42 + noise(index + 4) * 0.18,
        offset: noise(index + 5) * Math.PI * 2,
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
      };
    });
  }, []);

  return (
    <group rotation={[0.03, 0, -0.08]}>
      {hearts.map((heart, index) => (
        <Heart key={index} data={heart} texture={texture} />
      ))}
    </group>
  );
}
