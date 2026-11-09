import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {loadFont as loadSyne} from '@remotion/google-fonts/Syne';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {
  Surface,
  drawBubble,
  drawChip,
  drawCta,
  drawEndCard,
  drawHeading,
  drawHero,
  drawRowCard,
  drawScheduler,
  drawService,
  drawStep,
  makeSurface,
} from './cards';
import {chips, getRow, services, smsBubbles, steps} from './content';
import {CHIP_TILT, FEATURE_LIFT_UNITS, FEATURE_TILT, FOV, seek} from './timeline';

const syne = loadSyne('normal', {weights: ['700', '800'], subsets: ['latin']});
const inter = loadInter('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});
const interItalic = loadInter('italic', {weights: ['400'], subsets: ['latin']});

// Block rendering until the fonts exist, otherwise canvas text falls back to a system font.
const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([syne.waitUntilDone(), inter.waitUntilDone(), interItalic.waitUntilDone()])
      .then(() =>
        Promise.all([
          document.fonts.load('800 40px Syne'),
          document.fonts.load('700 40px Syne'),
          document.fonts.load('400 20px Inter'),
          document.fonts.load('500 20px Inter'),
          document.fonts.load('600 20px Inter'),
          document.fonts.load('italic 400 20px Inter'),
        ]),
      )
      .catch((e) => console.error('font load failed', e))
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};

// ── layout (world units; page plane is z = 0, y descends) ────
const L = {
  hero: {size: [12.6, 5.2] as [number, number], y: 0},
  chips: {size: [3.9, 1.7] as [number, number], xs: [-4.2, 0, 4.2], y: -4.1},
  steps: {size: [2.95, 2.3] as [number, number], xs: [-4.5, -1.5, 1.5, 4.5], y: -7.3},
  scheduler: {size: [6.4, 4.3] as [number, number], x: -3.6, y: -11.0},
  bubbles: [
    {size: [5.2, 1.25] as [number, number], x: 3.5, y: -9.9},
    {size: [2.0, 0.95] as [number, number], x: 5.1, y: -11.15},
    {size: [4.3, 0.95] as [number, number], x: 3.05, y: -12.25},
  ],
  services: {size: [2.95, 2.2] as [number, number], xs: [-4.5, -1.5, 1.5, 4.5], y: -14.9},
  heading: {size: [10, 1.3] as [number, number], y: -17.0},
  row: {size: [3.1, 2.4] as [number, number], xs: [-3.4, 0, 3.4], y: -19.0},
  cta: {size: [10, 2.2] as [number, number], y: -22.4},
  end: {size: [14.4, 11.52] as [number, number]}, // exactly the frame at the final camera distance
};

function buildAssets() {
  const row = getRow();
  const hero = makeSurface(...L.hero.size);
  drawHero(hero);
  const chipS = chips.map((c) => {
    const s = makeSurface(...L.chips.size);
    drawChip(s, c);
    return s;
  });
  const stepS = steps.map((c) => {
    const s = makeSurface(...L.steps.size);
    drawStep(s, c);
    return s;
  });
  const scheduler = makeSurface(...L.scheduler.size);
  drawScheduler(scheduler);
  const bubbleS = smsBubbles.map((b, i) => {
    const s = makeSurface(...L.bubbles[i].size);
    drawBubble(s, b);
    return s;
  });
  const serviceS = services.map((c) => {
    const s = makeSurface(...L.services.size);
    drawService(s, c);
    return s;
  });
  const heading = makeSurface(...L.heading.size);
  drawHeading(heading, row.heading, row.sub);
  const rowS = row.cards.map((c) => {
    const s = makeSurface(...L.row.size);
    drawRowCard(s, c);
    return s;
  });
  const cta = makeSurface(...L.cta.size);
  drawCta(cta);
  const end = makeSurface(...L.end.size, 2);
  return {hero, chipS, stepS, scheduler, bubbleS, serviceS, heading, rowS, cta, end};
}

// ── camera ───────────────────────────────────────────────────
const CameraRig: React.FC<{pos: THREE.Vector3; look: THREE.Vector3; roll: number}> = ({pos, look, roll}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.fov = FOV;
    camera.near = 0.1;
    camera.far = 200;
    camera.position.copy(pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.rotateZ(roll);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};

// ── a card that can lift off the page and tilt about its bottom edge ──
const Card: React.FC<{
  surf: Surface;
  size: [number, number];
  x: number;
  y: number; // centre of the card when flat
  lift?: number; // z units
  tilt?: number; // radians, positive = top toward the lens
  shadow?: number; // 0..1
}> = ({surf, size, x, y, lift = 0, tilt = 0, shadow = 0}) => {
  const [w, h] = size;
  return (
    <>
      {shadow > 0.01 && (
        <mesh position={[x, y - 0.04, 0.004]}>
          <planeGeometry args={[w * 1.08, h * 1.1]} />
          <meshBasicMaterial color="#000000" transparent opacity={Math.min(0.75, shadow * 0.75)} depthWrite={false} />
        </mesh>
      )}
      <group position={[x, y - h / 2, lift]} rotation={[tilt, 0, 0]}>
        <mesh position={[0, h / 2, 0]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={surf.tex} transparent toneMapped={false} />
        </mesh>
      </group>
    </>
  );
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const ready = useFonts();
  const assets = useMemo(() => (ready ? buildAssets() : null), [ready]);
  if (!assets) return null;

  const s = seek(frame / fps);

  // end card is redrawn each frame (typewriter) — only uploaded once it is visible
  if (s.morph > 0.001) {
    drawEndCard(assets.end, s);
    assets.end.tex.needsUpdate = true;
  }

  const clamp = (v: number) => Math.max(0, v);

  return (
    <ThreeCanvas width={width} height={height} camera={{fov: FOV, near: 0.1, far: 200, position: [0, -1.6, 12]}}>
      <color attach="background" args={['#050505']} />
      <CameraRig pos={s.camera.pos} look={s.camera.look} roll={s.camera.roll} />

      {/* page plane + faint grid for depth */}
      <mesh position={[0, -11.5, -0.05]}>
        <planeGeometry args={[16, 36]} />
        <meshBasicMaterial color="#0A0A0A" />
      </mesh>
      <gridHelper args={[48, 48, '#1a1a1a', '#121212']} rotation={[Math.PI / 2, 0, 0]} position={[0, -11.5, -0.04]} />

      {/* hero (fades into the end card) */}
      <mesh position={[0, L.hero.y, 0]}>
        <planeGeometry args={L.hero.size} />
        <meshBasicMaterial map={assets.hero.tex} transparent opacity={1 - s.morph} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* key lift 1 — stat chips stand up at 1.35s */}
      {assets.chipS.map((surf, i) => (
        <Card key={`chip${i}`} surf={surf} size={L.chips.size} x={L.chips.xs[i]} y={L.chips.y} lift={clamp(s.chips[i]) * 0.9} tilt={s.chips[i] * CHIP_TILT} shadow={clamp(s.chips[i])} />
      ))}

      {assets.stepS.map((surf, i) => (
        <Card key={`step${i}`} surf={surf} size={L.steps.size} x={L.steps.xs[i]} y={L.steps.y} />
      ))}

      <Card surf={assets.scheduler} size={L.scheduler.size} x={L.scheduler.x} y={L.scheduler.y} />

      {/* SMS bubbles lift at 3.4s */}
      {assets.bubbleS.map((surf, i) => (
        <Card key={`bubble${i}`} surf={surf} size={L.bubbles[i].size} x={L.bubbles[i].x} y={L.bubbles[i].y} lift={clamp(s.bubbles[i]) * 0.7} tilt={s.bubbles[i] * 0.18} shadow={clamp(s.bubbles[i])} />
      ))}

      {assets.serviceS.map((surf, i) => (
        <Card key={`svc${i}`} surf={surf} size={L.services.size} x={L.services.xs[i]} y={L.services.y} />
      ))}

      <Card surf={assets.heading} size={L.heading.size} x={0} y={L.heading.y} />

      {/* key lift 2 — featured row card: 112px high, 30° toward the lens, from 5.45s */}
      {assets.rowS.map((surf, i) => (
        <Card
          key={`row${i}`}
          surf={surf}
          size={L.row.size}
          x={L.row.xs[i]}
          y={L.row.y}
          lift={i === 0 ? s.feature * FEATURE_LIFT_UNITS : 0}
          tilt={i === 0 ? s.feature * FEATURE_TILT : 0}
          shadow={i === 0 ? s.feature : 0}
        />
      ))}

      <Card surf={assets.cta} size={L.cta.size} x={0} y={L.cta.y} />

      {/* end card — exactly fills the frame once the dive lands */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={L.end.size} />
        <meshBasicMaterial map={assets.end.tex} transparent opacity={s.morph} depthWrite={false} toneMapped={false} />
      </mesh>
    </ThreeCanvas>
  );
};
