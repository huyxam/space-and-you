import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import Planet from "./Planet";
import FloatingPhotos from "./FloatingPhotos";
import FloatingHearts from "./FloatingHearts";
import Stars from "./Stars";
import Galaxy from "./Galaxy";

export default function Scene({
  onSelect,
}) {
  return (
    <>
      {/* Background */}
      <color attach="background" args={["#02010a"]} />

      {/* Lights */}
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[15, 10, 10]}
        intensity={2}
      />

      <pointLight
        position={[0, 0, 0]}
        color="#ff9cf5"
        intensity={80}
        distance={80}
      />

      <Suspense fallback={null}>
        {/* Galaxy */}
        <Galaxy />

        {/* Stars */}
        <Stars />

        {/* Planet */}
        <Planet />

        {/* Photos */}
        <FloatingPhotos
          onSelect={onSelect}
        />

        {/* Hearts */}
        <FloatingHearts />
      </Suspense>

      {/* Camera */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        autoRotate
        autoRotateSpeed={0.25}
        minDistance={8}
        maxDistance={30}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />

      {/* Bloom */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={2}
          luminanceThreshold={0}
          luminanceSmoothing={0.3}
        />
      </EffectComposer>
    </>
  );
}