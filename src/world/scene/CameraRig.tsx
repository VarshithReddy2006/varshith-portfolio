/**
 * Camera navigation for the persistent world.
 *
 * - Each navigation state (landmark, project, aspect bucket) maps to a
 *   predefined viewpoint (src/world/landmarks.ts → viewFor).
 * - When the state changes, a new tween starts from wherever the camera is
 *   *right now*, so rapid selections never fight each other.
 * - Travel follows a gentle arc; reduced motion cuts instantly.
 * - Drag adds a clamped orbit offset; idle sway + pointer parallax only in
 *   the overview. The open panel's footprint shifts the projection so the
 *   selected landmark stays visible beside (or above) the panel.
 * - Labels are projected and laid out here, once per frame.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { bobY, landmarks, viewFor, type View } from '../landmarks';
import { isPanelOpen, registry, world } from '../store';
import { layoutLabels, type LabelPoint } from '../labels';
import { ascent, runtime } from '../journey';
import { useKit } from './kit';

/** Height the camera must clear when crossing the central island (tallest spire + margin). */
const CENTRAL_SKYLINE = 17.5;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Pose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const poseFrom = (v: View): Pose => ({ pos: new THREE.Vector3(...v.pos), target: new THREE.Vector3(...v.target), fov: v.fov });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Third-person camera for the arrival journey: behind and above the
 * traveller, looking up the stairs toward the gateway. As the ascent
 * progresses it rises and pulls back slightly so the islands come into view.
 * At s = 0 this is also the starting shot of the stage.
 */
function followPose(aspect: number, out: Pose) {
  const u = ascent(runtime.s);
  const isPortrait = aspect < 0.9;
  const k = aspect >= 1.3 ? 1 : aspect >= 0.9 ? 1.25 : 1.44;
  const [x, y, z] = runtime.pos;
  const yElev = isPortrait ? lerp(4.3, 6.6, u) : lerp(2.8, 6, u);
  const yTarget = isPortrait ? lerp(2.1, 3.2, u) : lerp(4.8, 3.4, u);
  out.pos.set(x, y + yElev * (k > 1 ? 1.05 : 1), z + lerp(7.0, 11.5, u) * k);
  out.target.set(x, y + yTarget, z - lerp(16, 13, u));
  out.fov = (aspect >= 1.3 ? 48 : aspect >= 0.9 ? 54 : 58) - u * 6;
}

export function CameraRig({ onReady }: { onReady: () => void }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const setDpr = useThree((s) => s.setDpr);
  const { q } = useKit();

  const base = useRef<Pose | null>(null);
  const tween = useRef({ key: '', from: null as Pose | null, to: null as Pose | null, t0: 0, dur: 0, arc: 0 });
  const orbit = useRef({ yaw: 0, pitch: 0, ty: 0, tp: 0 });
  const offset = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const perf = useRef({ frames: 0, acc: 0, lowered: false });
  const ready = useRef(0);
  const tmp = useMemo(
    () => ({
      off: new THREE.Vector3(),
      sph: new THREE.Spherical(),
      v: new THREE.Vector3(),
      points: [] as LabelPoint[],
      follow: { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 50 } as Pose,
    }),
    [],
  );

  // Drag-to-look (mouse, pen and touch) with a click tolerance.
  useEffect(() => {
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    let moved = 0;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      last = { x: e.clientX, y: e.clientY };
      moved = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (finePointer) {
        pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      }
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      last = { x: e.clientX, y: e.clientY };
      if (moved < 6 || world.get().intro === 'walking') return;
      const o = orbit.current;
      const lim = world.get().active === 'home' ? 0.5 : 0.32;
      o.ty = clamp(o.ty - dx * 0.0032, -lim, lim);
      o.tp = clamp(o.tp + dy * 0.0022, -0.1, 0.16);
      world.set({ panned: Math.abs(o.ty) > 0.02 || Math.abs(o.tp) > 0.02 });
    };
    const onUp = () => {
      last = null;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    registry.resetPan = () => {
      orbit.current.ty = 0;
      orbit.current.tp = 0;
      world.set({ panned: false });
    };
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      registry.resetPan = null;
    };
  }, [gl]);

  useFrame(({ clock }, delta) => {
    const s = world.get();
    const W = size.width;
    const H = size.height;
    const aspect = W / H;
    const now = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const motion = q.motion;

    // ---- choose the destination --------------------------------------
    const bucket = aspect >= 1.3 ? 'w' : aspect >= 0.9 ? 'm' : 'n';
    const project = s.active === 'projects' ? s.project : null;
    const key = `${s.active}|${project ?? ''}|${bucket}`;
    const tw = tween.current;

    const inIntro = s.intro !== 'arrived';

    if (!base.current) {
      // Establishing shot: drift in from high and far behind the viewpoint.
      if (inIntro) {
        followPose(aspect, tmp.follow);
        base.current = { pos: tmp.follow.pos.clone(), target: tmp.follow.target.clone(), fov: tmp.follow.fov };
        if (motion) base.current.pos.add(new THREE.Vector3(0, 6, 14));
      } else {
        const v = poseFrom(viewFor(s.active, aspect, project));
        base.current = { pos: v.pos.clone(), target: v.target.clone(), fov: v.fov };
        if (motion) base.current.pos.add(new THREE.Vector3(0, 9, 26));
      }
    }

    if (inIntro) {
      // Stage and ascent: the camera follows the traveller (damped, no tween).
      followPose(aspect, tmp.follow);
      const b = base.current;
      const kf = motion ? 1 - Math.exp(-dt * (s.intro === 'walking' ? 3.2 : 1.6)) : 1;
      b.pos.lerp(tmp.follow.pos, kf);
      b.target.lerp(tmp.follow.target, kf);
      b.fov += (tmp.follow.fov - b.fov) * kf;
      tw.key = `intro|${bucket}`;
      tw.from = tw.to = null;
      if (s.intro === 'walking' && (orbit.current.ty || orbit.current.tp)) {
        orbit.current.ty = 0;
        orbit.current.tp = 0;
        world.set({ panned: false });
      }
    } else if (key !== tw.key) {
      const fromIntro = tw.key.startsWith('intro');
      const bucketOnly = tw.key && tw.key.split('|').slice(0, 2).join('|') === key.split('|').slice(0, 2).join('|');
      const b = base.current;
      tw.from = { pos: b.pos.clone(), target: b.target.clone(), fov: b.fov };
      tw.to = poseFrom(viewFor(s.active, aspect, project));
      const dist = tw.from.pos.distanceTo(tw.to.pos) + tw.from.target.distanceTo(tw.to.target) * 0.5;
      tw.t0 = now;
      // Arriving from the stairs: a slow crane up and back that reveals the world.
      tw.dur = !motion ? 0 : fromIntro ? (runtime.autoFinish ? 4.2 : 2.4) : bucketOnly ? 0.6 : !tw.key ? 3.2 : clamp(1.1 + dist * 0.022, 1.3, 2.6);
      tw.arc = motion && !bucketOnly ? Math.min(5, dist * 0.1) : 0;
      if (motion && !bucketOnly) {
        // Never fly through the central portal's towers: if the straight
        // path crosses the central island, lift the arc above its skyline.
        const mid = tw.from.pos.clone().lerp(tw.to.pos, 0.5);
        for (const k of [0.25, 0.5, 0.75]) {
          const pt = tw.from.pos.clone().lerp(tw.to.pos, k);
          if (Math.hypot(pt.x, pt.z + 8) < 9.5) tw.arc = Math.max(tw.arc, CENTRAL_SKYLINE - mid.y);
        }
      }
      tw.key = key;
      if (!bucketOnly) {
        orbit.current.ty = 0;
        orbit.current.tp = 0;
        world.set({ panned: false });
      }
    }

    // ---- tween ---------------------------------------------------------
    const b = base.current;
    if (tw.from && tw.to) {
      const p = tw.dur > 0 ? clamp((now - tw.t0) / tw.dur, 0, 1) : 1;
      const e = easeInOutCubic(p);
      b.pos.lerpVectors(tw.from.pos, tw.to.pos, e);
      b.pos.y += Math.sin(Math.PI * p) * tw.arc;
      b.target.lerpVectors(tw.from.target, tw.to.target, e);
      b.fov = tw.from.fov + (tw.to.fov - tw.from.fov) * e;
    }

    // ---- orbit offsets: drag + idle sway + pointer parallax -----------
    const o = orbit.current;
    const k = 1 - Math.exp(-dt * 5);
    o.yaw += (o.ty - o.yaw) * k;
    o.pitch += (o.tp - o.pitch) * k;
    const overview = s.active === 'home' && s.intro !== 'walking';
    // Cinematic camera breathing & subtle organic film float
    const breath = motion ? Math.sin(now * 0.38) * 0.004 + Math.cos(now * 0.22) * 0.0025 : 0;
    const sway = (overview ? Math.sin(now * 0.07) * 0.03 : 0) * motion + breath;
    const filmPitch = motion ? Math.sin(now * 0.28) * 0.003 : 0;
    const par = overview && motion ? pointer.current.x * 0.032 : 0;
    const parY = overview && motion ? pointer.current.y * 0.016 : 0;

    tmp.off.subVectors(b.pos, b.target);
    tmp.sph.setFromVector3(tmp.off);
    tmp.sph.theta += o.yaw + sway - par;
    tmp.sph.phi = clamp(tmp.sph.phi - o.pitch + parY + filmPitch, 0.35, 1.68);
    tmp.off.setFromSpherical(tmp.sph);
    camera.position.copy(b.target).add(tmp.off);
    camera.lookAt(b.target);
    camera.fov = b.fov;

    // ---- keep the landmark visible beside the open panel --------------
    const pb = isPanelOpen(s) ? registry.panelBox : null;
    const wantX = pb?.side === 'right' ? pb.size / 2 : 0;
    const wantY = pb?.side === 'bottom' ? pb.size / 2 : 0;
    const ko = motion ? 1 - Math.exp(-dt * 3) : 1;
    offset.current.x += (wantX - offset.current.x) * ko;
    offset.current.y += (wantY - offset.current.y) * ko;
    if (Math.abs(offset.current.x) + Math.abs(offset.current.y) > 0.5) {
      camera.setViewOffset(W, H, offset.current.x, offset.current.y, W, H);
    } else {
      if (camera.view) camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // ---- labels ----------------------------------------------------------
    if (s.mode === '3d') {
      const pts = tmp.points;
      pts.length = 0;
      const t = now * motion;
      for (const l of landmarks) {
        const c = l.island;
        tmp.v.set(c.pos[0] + l.label.at[0], c.pos[1] + bobY(c, t) + l.label.at[1], c.pos[2] + l.label.at[2]).project(camera);
        pts.push({
          id: l.id,
          x: (tmp.v.x * 0.5 + 0.5) * W,
          y: (-tmp.v.y * 0.5 + 0.5) * H,
          ok: tmp.v.z < 1 && tmp.v.z > -1,
        });
      }
      layoutLabels(pts, W, H, 1 - Math.exp(-dt * 14));
    }

    // ---- adaptive resolution ---------------------------------------------
    const pf = perf.current;
    if (!pf.lowered && ready.current > 30) {
      pf.frames++;
      pf.acc += delta;
      if (pf.frames === 120) {
        if (pf.acc / pf.frames > 1 / 38 && gl.getPixelRatio() > 1) {
          setDpr(1);
          pf.lowered = true;
        }
        pf.frames = 0;
        pf.acc = 0;
      }
    }

    if (ready.current <= 30 && ++ready.current === 3) onReady();
  });

  return null;
}
