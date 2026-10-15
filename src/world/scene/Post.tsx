/**
 * Lighting polish:
 *  - WarmEnvironment: a tiny procedural sunset scene baked once into a PMREM
 *    environment map, so metal and stone pick up warm reflections (PBR).
 *  - Bloom: subtle UnrealBloom on high-tier devices only, rendered at the
 *    canvas pixel ratio with a high threshold so only lit windows, rings and
 *    strips glow. Takes over rendering (priority 1) so there is still exactly
 *    one render per frame.
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export function WarmEnvironment({ intensity = 0.32 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const env = new THREE.Scene();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `varying vec3 vP;
          void main(){
            vec3 d = normalize(vP);
            vec3 top = vec3(0.05, 0.045, 0.045);
            vec3 hor = vec3(0.9, 0.55, 0.26);
            vec3 low = vec3(0.12, 0.08, 0.05);
            vec3 c = d.y > 0.0 ? mix(hor, top, pow(d.y, 0.45)) : mix(hor * 0.6, low, pow(-d.y, 0.5));
            float sun = pow(max(dot(d, normalize(vec3(0.04, 0.07, -1.0))), 0.0), 24.0);
            gl_FragColor = vec4(c + vec3(1.0, 0.7, 0.4) * sun * 2.0, 1.0);
          }`,
      }),
    );
    env.add(sky);
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(env, 0.035);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      sky.geometry.dispose();
      (sky.material as THREE.Material).dispose();
    };
  }, [gl, scene, intensity]);
  return null;
}

export function Bloom({ strength = 0.22, radius = 0.35, threshold = 0.92 }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), strength, radius, threshold));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, strength, radius, threshold]);

  useEffect(() => {
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height, dpr]);
  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(() => composer.render(), 1);
  return null;
}
