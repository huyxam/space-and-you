import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, HueSaturation, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import Intro from './components/Intro';
import Popup from './components/Popup';
import Planet from './components/Planet';
import Galaxy from './components/Galaxy';
import FloatingHearts from './components/FloatingHearts';
import ShootingStars from "./components/ShootingStars";
import DistantPlanets from './components/DistantPlanets';
import { CanvasErrorBoundary } from './components/CanvasErrorBoundary';
import { myImages } from './data/imageData';
import './styles/app.css';

// Detect if device is mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
};

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const musicRef = useRef(null);
  const selectedCard = selectedCardId ? myImages.find(img => img.url === selectedCardId) : null;
  
  const isMobileDevice = useMemo(() => isMobile(), []);
  
  // Optimize settings for mobile
  const canvasSettings = useMemo(() => ({
    dpr: isMobileDevice ? [1, 1] : [1, 1.5],
    pixelRatio: isMobileDevice ? 1 : 1.5,
  }), [isMobileDevice]);

  const startMusic = () => {
    if (!musicRef.current) return;

    musicRef.current.muted = false;
    musicRef.current.volume = 0.42;
    musicRef.current.currentTime = 0;
    musicRef.current
      .play()
      .catch((error) => {
        console.warn('Audio playback failed:', error);
      });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>

      <audio
        ref={musicRef}
        src="/music/background-music.mp3"
        loop
        preload="auto"
      />

      {!isStarted && (
        <Intro
          onEnter={startMusic}
          onStart={() => setIsStarted(true)}
        />
      )}

      {isStarted && (
        <CanvasErrorBoundary>
          <Canvas
            dpr={canvasSettings.dpr}
            camera={{ position: [0, 7, 19], fov: 45 }}
            gl={{
              alpha: true,
              antialias: !isMobileDevice,
              preserveDrawingBuffer: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.18,
              powerPreference: 'high-performance',
            }}
            onCreated={(state) => {
              state.gl.setClearColor(0x120d40, 1);
            }}
          >
            <color attach="background" args={['#050505']} />
            <Suspense fallback={null}>
              <color attach="background" args={['#120d40']} />
              <fog attach="fog" args={['#120d40', 30, 102]} />

              <ambientLight intensity={isMobileDevice ? 0.8 : 1.0} color="#dac4ff" />
              <hemisphereLight args={['#ffb3f0', '#201033', 0.72]} />
              <directionalLight position={[5, 7, 10]} intensity={isMobileDevice ? 1.0 : 1.4} color="#ffdbff" />
              <pointLight position={[2.8, 2.2, 3.4]} color="#ffd0ff" intensity={isMobileDevice ? 2.0 : 3.1} distance={20} />
              {!isMobileDevice && <pointLight position={[-6, 3.4, 4]} color="#8b72ff" intensity={0.9} distance={26} />}
              {!isMobileDevice && <pointLight position={[8, -1.4, -2]} color="#ffb5ee" intensity={0.8} distance={16} />}

              <Stars radius={190} depth={78} count={isMobileDevice ? 2500 : 5200} factor={4.2} saturation={0.24} fade speed={0.55} />
              {!isMobileDevice && <Sparkles count={260} scale={[76, 42, 76]} size={2.0} speed={0.18} color="#ffd4ff" opacity={0.72} />}

              <OrbitControls
                autoRotate
                autoRotateSpeed={0.12}
                enableDamping
                dampingFactor={0.05}
                enablePan={false}
                maxDistance={26}
                minDistance={7.5}
              />

              <Planet />
              <ShootingStars />
              <DistantPlanets />
              <Galaxy selectedCardId={selectedCardId} onCardSelect={setSelectedCardId} />
              <FloatingHearts />

              <EffectComposer multisampling={0}>
                <Bloom 
                  mipmapBlur 
                  intensity={isMobileDevice ? 0.4 : 0.9} 
                  luminanceThreshold={0.18} 
                  luminanceSmoothing={0.42} 
                  resolutionScale={isMobileDevice ? 0.25 : 0.45} 
                />
                <HueSaturation saturation={0.08} />
                <Vignette eskil={false} offset={0.38} darkness={0.18} />
              </EffectComposer>
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      )}

      <Popup selectedCard={selectedCard} onClose={() => setSelectedCardId(null)} />

    </div>
  );
}
