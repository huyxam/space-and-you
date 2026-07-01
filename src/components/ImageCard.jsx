import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide, Vector3, Euler, LinearFilter, LinearMipMapLinearFilter, Object3D } from "three";
import { damp3, dampE } from "maath/easing";
import { orbitPosition } from "../math";

const tempObject = new Object3D();

export default function ImageCard({ data, texture, selectedId, onSelect }) {
  const { gl, camera } = useThree();
  const isSelected = selectedId === data.id;

  if (texture && gl?.capabilities) {
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.minFilter = LinearMipMapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }

  const group = useRef();
  const meshRef = useRef();
  const hoverRef = useRef(false);

  // Orbit reference position (will be updated in useFrame)
  const orbitRefPosition = useRef(new Vector3(...orbitPosition(data, 0)));

  // Selected target position in world space
  const selectedTargetPosition = new Vector3(0, 0, 2);
  const selectedTargetRotation = new Euler(0, 0, 0);

  useFrame((state, delta) => {
    if (!group.current || !meshRef.current) return;

    const t = state.clock.elapsedTime;

    // Update orbit position
    const [orbitX, orbitY, orbitZ] = orbitPosition(data, t);
    orbitRefPosition.current.set(orbitX, orbitY, orbitZ);

    // Calculate orbit rotation for facing camera
    tempObject.position.copy(orbitRefPosition.current);
    tempObject.lookAt(camera.position);
    tempObject.rotation.z += Math.sin(t * 0.55 + data.offset) * 0.026 + data.tilt;
    const orbitEuler = tempObject.rotation;

    // Target values based on selection state
    const targetPos = isSelected ? selectedTargetPosition : orbitRefPosition.current;
    const targetRot = isSelected
      ? selectedTargetRotation
      : orbitEuler;

    // Damping with delta for smooth interpolation
    damp3(
      group.current.position,
      targetPos,
      isSelected ? 0.08 : 0.12,
      delta
    );

    dampE(
      group.current.rotation,
      targetRot,
      isSelected ? 0.08 : 0.12,
      delta
    );

    // Scale damping
    const targetScale = isSelected ? 2.8 : data.size * (hoverRef.current ? 1.08 : 1);
    group.current.scale.lerp(
      new Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Material properties for hover glow and selected fade
    const material = meshRef.current.material;
    if (material) {
      const targetEmissive = hoverRef.current && !isSelected ? 0.35 : 0;
      material.emissiveIntensity +=
        (targetEmissive - material.emissiveIntensity) * 0.1;

      const targetOpacity = selectedId && !isSelected ? 0.4 : 1.0;
      material.opacity += (targetOpacity - material.opacity) * 0.1;
      material.transparent = material.opacity < 1.0;
    }
  });

  return (
    <group ref={group}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : data.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoverRef.current = true;
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          hoverRef.current = false;
        }}
      >
        <planeGeometry args={[1, 1.34]} />
        <meshStandardMaterial
          map={texture}
          emissive="#ffffff"
          emissiveIntensity={0}
          toneMapped={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
