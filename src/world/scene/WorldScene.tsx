/**
 * The persistent WebGL world (lazy-loaded chunk). Mounted once; navigation
 * only moves the camera, so the scene graph is never rebuilt.
 */
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { landmarks } from '../landmarks';
import { CameraRig } from './CameraRig';
import { Clouds, Distant, Embers, FlockOfBirds, GoldenPaths, OrbitRing, Planet, Sky, SunGodRays } from './Environment';
import { Character } from './Character';
import { JourneyDriver, RevealFog } from './Journey';
import { Bloom, WarmEnvironment } from './Post';
import { CentralStage, Staircase } from './Stage';
import { KitProvider, type Quality } from './kit';
import { buildings, LandmarkNode } from './Landmarks';

export interface WorldSceneProps {
  quality: Quality;
  onReady: () => void;
  onLost: () => void;
}

export default function WorldScene({ quality, onReady, onLost }: WorldSceneProps) {
  const high = quality.tier === 'high';
  return (
    <Canvas
      dpr={high ? [1, 1.75] : [1, 1.35]}
      shadows={high ? { type: THREE.PCFShadowMap } : false}
      camera={{ position: [0, 13, 60], fov: 42, near: 0.5, far: 1200 }}
      gl={{
        antialias: high,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0d0a08');
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        if (high) {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
        }
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onLost();
        });
      }}
      style={{ touchAction: 'none' }}
      aria-hidden
    >
      <KitProvider quality={quality}>
        <fogExp2 attach="fog" args={['#1c1510', 0.0065]} />
        {/* Sky / ground hemisphere light: twilight blue skylight + warm earthy bounce */}
        <hemisphereLight args={['#68728a', '#18120e', 0.75]} />
        {/* Main cinematic directional sunlight casting soft contact shadows */}
        <directionalLight
          color="#ffd49e"
          intensity={1.45}
          position={[24, 28, -60]}
          castShadow={high}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.00035}
          shadow-camera-near={1}
          shadow-camera-far={190}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
        />
        {/* Soft golden horizon fill */}
        <directionalLight color="#caa277" intensity={0.5} position={[-16, 12, 32]} />
        {/* Warm sunset rim backlight */}
        <directionalLight color="#cc6630" intensity={0.35} position={[0, -10, 12]} />

        <Sky />
        <SunGodRays />
        <Planet />
        <Distant />
        <FlockOfBirds />

        {landmarks.map((def) => {
          const Building = buildings[def.id];
          return (
            <LandmarkNode key={def.id} def={def}>
              <Building />
            </LandmarkNode>
          );
        })}

        <GoldenPaths />
        <OrbitRing />
        <CentralStage />
        <Staircase />
        <Character />
        <Clouds />
        <Embers />
        <WarmEnvironment intensity={high ? 0.32 : 0.22} />

        {/* Order matters: the journey updates the traveller before the rig reads it. */}
        <JourneyDriver />
        <RevealFog />
        <CameraRig onReady={onReady} />
        {high && <Bloom strength={0.16} radius={0.35} threshold={0.94} />}
      </KitProvider>
    </Canvas>
  );
}

