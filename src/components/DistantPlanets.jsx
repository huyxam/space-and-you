import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noise, orbitPosition } from '../math';

export default function DistantPlanets() {
  const groupRef = useRef();

  const planets = useMemo(() => {
    const planetData = [
      // Sử dụng xRadius/zRadius thay cho radius và thêm y: 0
      { color: '#c1440e', size: 0.8, xRadius: 22, zRadius: 22, y: 0, speed: 0.04, floatSpeed: 0.3, floatRange: 0.5 },
      { color: '#d8ca9d', size: 2.5, xRadius: 35, zRadius: 35, y: 0, speed: 0.02, floatSpeed: 0.2, floatRange: 0.3 },
      { color: '#d1b26f', size: 2.0, xRadius: 50, zRadius: 50, y: 0, speed: 0.01, floatSpeed: 0.15, floatRange: 0.2, hasRings: true, ringColor: '#a5916b' },
    ];

    return planetData.map((p, i) => ({
      ...p,
      baseAngle: noise(i * 10) * Math.PI * 2,
      offset: noise(i * 11) * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((planetGroup, index) => {
      const data = planets[index];
      const [x, y, z] = orbitPosition(data, t);
      planetGroup.position.set(x, y, z);
    });
  });

  return (
    <group ref={groupRef}>
      {planets.map((planet, index) => (
        <group key={index}>
          <mesh>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <meshStandardMaterial color={planet.color} roughness={0.8} metalness={0.1} />
          </mesh>
          {planet.hasRings && (
            <mesh rotation-x={Math.PI / 2.2}>
              <ringGeometry args={[planet.size * 1.3, planet.size * 2, 64]} />
              <meshBasicMaterial
                color={planet.ringColor}
                side={THREE.DoubleSide}
                transparent
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}