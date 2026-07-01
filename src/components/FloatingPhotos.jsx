import { useLoader, useFrame, useThree } from "@react-three/fiber";
import { TextureLoader, Vector3, LinearFilter, LinearMipMapLinearFilter } from "three";
import { useMemo, useRef, useState } from "react";
import { myImages } from "../data/imageData";

function Photo({
  url,
  radius,
  text,
  angle,
  height,
 speed,
  size,
  onClick,
}) {
  const texture = useLoader(TextureLoader, url);
  const { gl } = useThree();

  if (texture && gl?.capabilities) {
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.minFilter = LinearMipMapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }

  const ref = useRef();
  const hover = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const t = state.clock.elapsedTime * speed;

    ref.current.position.x =
      Math.cos(angle + t) * radius;

    ref.current.position.z =
      Math.sin(angle + t) * radius;

    ref.current.position.y =
      height +
      Math.sin(state.clock.elapsedTime * 1.5 + angle) * 0.35;

    ref.current.lookAt(state.camera.position);

    ref.current.rotation.z =
      Math.sin(state.clock.elapsedTime + angle) * 0.04;

    const target = hover.current ? 1.25 : 1;

    ref.current.scale.lerp(
      new Vector3(target, target, target),
      delta * 6
    );
  });

  return (
    <mesh
      ref={ref}
      onPointerOver={() => (hover.current = true)}
      onPointerOut={() => (hover.current = false)}
      onClick={() =>
        onClick({
          image: url,
          text,
          position: [
            ref.current.position.x,
            ref.current.position.y,
            ref.current.position.z,
          ],
        })
      }
    >
      <planeGeometry args={size} />

      <meshStandardMaterial
        map={texture}
        transparent
        emissive="white"
        emissiveIntensity={0.35}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function FloatingPhotos({ onSelect }) {
  const isMobile =
    typeof window !== "undefined" &&
    window.innerWidth < 768;

  const photos = useMemo(() => {
    const count = myImages.length;

    const rings = [
      {
        radius: 9,
        height: -2,
      },
      {
        radius: 12,
        height: 0,
      },
      {
        radius: 15,
        height: 2,
      },
    ];

    return Array.from({ length: count }, (_, i) => {
      const ring = Math.floor(i / 15);

      const localIndex = i % 15;

      const baseAngle =
        (localIndex / 15) * Math.PI * 2;

      return {
        url: myImages[i].url,
        text: myImages[i].text,

        radius:
          rings[ring].radius +
          (Math.random() - 0.5) * 0.5,

        angle:
          baseAngle +
          (Math.random() - 0.5) * 0.15,

        height:
          rings[ring].height +
          (Math.random() - 0.5) * 0.4,

        speed:
          0.08 +
          ring * 0.02,

        size: isMobile
          ? [1.2, 1.8]
          : [1.7, 2.5],
      };
    });
  }, []);

  return (
    <>
      {photos.map((photo, index) => (
        <Photo
          key={index}
          {...photo}
          onClick={onSelect}
        />
      ))}
    </>
  );
}