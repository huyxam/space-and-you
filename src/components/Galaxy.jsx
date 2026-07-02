import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { myImages } from "../data/imageData";
import { noise, orbitPosition } from "../math";
import ImageCard from "./ImageCard";

function OrbitalDust({ layers }) {
  const group = useRef();

  const dustLayers = useMemo(() => {
    return layers.flatMap((layer, layerIndex) => {
      const density = 3300 - layerIndex * 360;
      const color = new THREE.Color();

      return ["fine", "glow"].map((kind, kindIndex) => {
        const count = kind === "fine" ? density : Math.floor(density * 0.22);
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const seeds = new Float32Array(count * 4);

        for (let i = 0; i < count; i++) {
          const seed = layerIndex * 100000 + kindIndex * 20000 + i;
          const band = Math.pow(noise(seed + 1), 1.65) - 0.5;
          const angle = noise(seed + 2) * Math.PI * 2;
          const radialOffset = band * layer.dustWidth;
          const heightOffset =
            (noise(seed + 3) - 0.5) *
            layer.dustHeight *
            (kind === "fine" ? 1 : 1.35);
          const orbit = {
            ...layer,
            baseAngle: angle,
            xRadius: layer.radius + radialOffset,
            zRadius: layer.radius + radialOffset,
            y: heightOffset,
            speed: layer.speed * (kind === "fine" ? 0.92 : 0.82),
            floatSpeed: 0.42 + noise(seed + 4) * 0.28,
            floatRange: 0.025 + noise(seed + 5) * 0.055,
            offset: noise(seed + 6) * Math.PI * 2,
          };

          const [x, y, z] = orbitPosition(orbit, 0);
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;

          const palette = noise(seed + 7);
          color.set(
            palette > 0.82
              ? "#ffbd7a"
              : palette > 0.55
                ? "#ff8fbd"
                : "#a897ff"
          );
          color.multiplyScalar(kind === "fine" ? 0.58 + noise(seed + 8) * 0.58 : 0.86 + noise(seed + 8) * 0.46);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;

          seeds[i * 4] = angle;
          seeds[i * 4 + 1] = radialOffset;
          seeds[i * 4 + 2] = heightOffset;
          seeds[i * 4 + 3] = noise(seed + 9) * Math.PI * 2;
        }

        return {
          layer,
          kind,
          positions,
          colors,
          seeds,
          size: kind === "fine" ? 0.05 - layerIndex * 0.003 : 0.115 - layerIndex * 0.006,
          opacity: kind === "fine" ? 0.88 - layerIndex * 0.045 : 0.6 - layerIndex * 0.035,
        };
      });
    });
  }, [layers]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    dustLayers.forEach((dustLayer, layerIndex) => {
      const points = group.current?.children[layerIndex];
      if (!points) return;

      const position = points.geometry.attributes.position;

      for (let i = 0; i < position.count; i++) {
        const angle = dustLayer.seeds[i * 4];
        const radialOffset = dustLayer.seeds[i * 4 + 1];
        const heightOffset = dustLayer.seeds[i * 4 + 2];
        const offset = dustLayer.seeds[i * 4 + 3];
        const orbit = {
          ...dustLayer.layer,
          baseAngle: angle,
          xRadius: dustLayer.layer.radius + radialOffset,
          zRadius: dustLayer.layer.radius + radialOffset,
          y: heightOffset,
          speed: dustLayer.layer.speed * (dustLayer.kind === "fine" ? 0.92 : 0.82),
          floatSpeed: 0.44,
          floatRange: dustLayer.kind === "fine" ? 0.04 : 0.07,
          offset,
        };
        const [x, y, z] = orbitPosition(orbit, t);
        position.setXYZ(i, x, y, z);
      }

      position.needsUpdate = true;
    });
  });

  return (
    <group ref={group}>
      {dustLayers.map((layer, index) => (
        <points key={index}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[layer.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={layer.size}
            vertexColors
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </group>
  );
}

function PhotoDustClusters({ photos }) {
  const group = useRef();

  const clusters = useMemo(() => {
    const color = new THREE.Color();

    return photos.map((photo, photoIndex) => {
      const count = 42;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const particles = [];

      for (let i = 0; i < count; i++) {
        const seed = photoIndex * 1000 + i;
        const localAngle = (noise(seed + 1) - 0.5) * 0.38;
        const radialOffset = (noise(seed + 2) - 0.5) * photo.clusterWidth;
        const heightOffset = (noise(seed + 3) - 0.5) * photo.clusterHeight;
        const [x, y, z] = orbitPosition(photo, 0, localAngle, radialOffset, heightOffset);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        color.set(noise(seed + 4) > 0.55 ? "#ff9fca" : "#c5b9ff");
        color.multiplyScalar(0.8 + noise(seed + 5) * 0.45);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        particles.push({ localAngle, radialOffset, heightOffset });
      }

      return { photo, positions, colors, particles };
    });
  }, [photos]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    clusters.forEach((cluster, clusterIndex) => {
      const points = group.current?.children[clusterIndex];
      if (!points) return;

      const position = points.geometry.attributes.position;

      cluster.particles.forEach((particle, index) => {
        const [x, y, z] = orbitPosition(
          cluster.photo,
          t,
          particle.localAngle,
          particle.radialOffset,
          particle.heightOffset
        );
        position.setXYZ(index, x, y, z);
      });

      position.needsUpdate = true;
    });
  });

  return (
    <group ref={group}>
      {clusters.map((cluster, index) => (
        <points key={index}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cluster.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[cluster.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.085}
            vertexColors
            transparent
            opacity={0.78}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </group>
  );
}

function OrbitalRocks({ layers }) {
  const group = useRef();

  const rocks = useMemo(() => {
    return Array.from({ length: 128 }, (_, index) => {
      const layerPick = Math.pow(noise(index * 3 + 1), 1.7);
      const layerIndex = Math.min(layers.length - 1, Math.floor(layerPick * layers.length));
      const layer = layers[layerIndex];
      const radialOffset = (noise(index * 7 + 3) - 0.5) * layer.dustWidth * 1.35;

      return {
        ...layer,
        baseAngle: noise(index * 5 + 2) * Math.PI * 2,
        xRadius: layer.radius + radialOffset,
        zRadius: layer.radius + radialOffset,
        y: (noise(index * 13 + 5) - 0.5) * layer.dustHeight * 1.8,
        speed: layer.speed * (0.72 + noise(index * 17 + 6) * 0.16),
        floatSpeed: 0.46 + noise(index * 19 + 7) * 0.2,
        floatRange: 0.04 + noise(index * 23 + 8) * 0.08,
        size: 0.035 + noise(index * 29 + 9) * 0.095,
        offset: noise(index * 31 + 10) * Math.PI * 2,
        layerIndex,
      };
    });
  }, [layers]);

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;
    group.current.children.forEach((rock, index) => {
      const data = rocks[index];
      const [x, y, z] = orbitPosition(data, t);

      rock.position.set(x, y, z);
      rock.rotation.x += 0.01 + data.size * 0.04;
      rock.rotation.y += 0.008 + data.size * 0.03;
    });
  });

  return (
    <group ref={group}>
      {rocks.map((rock, index) => (
        <mesh key={index} scale={rock.size}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={rock.layerIndex % 2 ? "#7f76a8" : "#a093bb"}
            roughness={0.82}
            metalness={0.04}
            emissive="#2b1745"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Galaxy({ selectedCardId, onCardSelect }) {
  const layers = useMemo(
    () => [
      { radius: 5.9, speed: 0.18, size: 1.04, dustWidth: 2.25, dustHeight: 0.58 },
      { radius: 7.5, speed: 0.148, size: 0.98, dustWidth: 2.45, dustHeight: 0.66 },
      { radius: 9.2, speed: 0.118, size: 0.92, dustWidth: 2.65, dustHeight: 0.74 },
      { radius: 10.9, speed: 0.092, size: 0.84, dustWidth: 2.9, dustHeight: 0.84 },
      { radius: 12.6, speed: 0.072, size: 0.78, dustWidth: 3.15, dustHeight: 0.94 },
      { radius: 14.3, speed: 0.056, size: 0.72, dustWidth: 3.4, dustHeight: 1.04 },
    ],
    []
  );

  const textures = useLoader(THREE.TextureLoader, myImages.slice(0, 45).map(img => img.url));

  const photos = useMemo(() => {
    const photoCount = 45;
    const clusterSize = 3;
    const clusterCount = Math.ceil(photoCount / clusterSize);

    return myImages.slice(0, photoCount).map((img, index) => {
      const clusterIndex = Math.floor(index / clusterSize);
      const indexInCluster = index % clusterSize;
      const layerPick = Math.pow(noise(clusterIndex * 5 + indexInCluster + 2), 1.18);
      const layerIndex = Math.min(layers.length - 1, Math.floor(layerPick * layers.length));
      const layer = layers[layerIndex];
      const clusterAngle =
        (clusterIndex / clusterCount) * Math.PI * 2 +
        (noise(clusterIndex * 11 + 1) - 0.5) * 0.18;
      const clusterSpread = (indexInCluster - 1) * 0.085;
      const baseAngle = clusterAngle + clusterSpread + (noise(index * 2 + 1) - 0.5) * 0.055;
      const bandOffset = (noise(index * 31 + 12) - 0.5) * layer.dustWidth * 0.86;

      return {
        id: img.url, // Sử dụng URL làm ID duy nhất
        ...img,
        ...layer,
        layerIndex,
        baseAngle,
        xRadius: layer.radius + bandOffset,
        zRadius: layer.radius + bandOffset,
        y: (noise(index * 7 + 4) - 0.5) * layer.dustHeight * 1.1 + (indexInCluster - 1) * 0.18,
        speed: layer.speed * (0.92 + noise(index * 11 + 5) * 0.12),
        floatSpeed: 0.5 + noise(index * 13 + 6) * 0.22,
        floatRange: 0.05 + noise(index * 17 + 7) * 0.09,
        tilt: (noise(index * 19 + 8) - 0.5) * 0.18,
        size: layer.size * (0.96 + noise(index * 23 + 9) * 0.22),
        offset: noise(index * 29 + 10) * Math.PI * 2,
        clusterWidth: layer.dustWidth * 0.62,
        clusterHeight: layer.dustHeight * 0.95,
      };
    });
  }, [layers]);

  return (
    <group rotation={[0.03, 0, -0.08]}>
      <OrbitalDust layers={layers} />
      <PhotoDustClusters photos={photos} />
      <OrbitalRocks layers={layers} />
      {photos.map((photo, index) => (
        <ImageCard
          key={photo.id}
          data={photo}
          texture={textures[index]}
          selectedId={selectedCardId}
          onSelect={onCardSelect}
        />
      ))}
    </group>
  );
}
