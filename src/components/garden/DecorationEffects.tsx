import React from 'react';
import { Group, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

// ── Fountain spray effect ──

export function FountainSpray({
  sx,
  sy,
  progress,
}: {
  sx: number;
  sy: number; // top of the fountain column
  progress: SharedValue<number>;
}) {
  // 3 water droplets arcing up and falling
  const drops = [
    { angle: -0.6, speed: 1.5, phase: 0 },
    { angle: 0, speed: 1.8, phase: 0.33 },
    { angle: 0.6, speed: 1.5, phase: 0.66 },
  ];

  return (
    <Group>
      {drops.map((d, i) => (
        <FountainDrop key={`fd-${i}`} sx={sx} sy={sy} angle={d.angle} speed={d.speed} phase={d.phase} progress={progress} />
      ))}
      {/* Central spray mist */}
      <FountainMist sx={sx} sy={sy} progress={progress} />
    </Group>
  );
}

function FountainDrop({
  sx, sy, angle, speed, phase, progress,
}: {
  sx: number; sy: number; angle: number; speed: number; phase: number;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return sx + Math.sin(angle) * t * 10;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return sy - t * 14 + t * t * 20; // parabolic arc
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return (1 - t) * 0.6;
  });
  return <Circle cx={cx} cy={cy} r={1.2} color="rgba(120,180,230,0.7)" opacity={opacity} />;
}

function FountainMist({
  sx, sy, progress,
}: {
  sx: number; sy: number;
  progress: SharedValue<number>;
}) {
  const r = useDerivedValue(() => {
    return 3 + Math.sin(progress.value * Math.PI * 6) * 2;
  });
  const opacity = useDerivedValue(() => {
    return 0.08 + Math.sin(progress.value * Math.PI * 4) * 0.05;
  });
  return <Circle cx={sx} cy={sy - 6} r={r} color="rgba(150,200,240,1)" opacity={opacity} />;
}

// ── Pond ripple effect ──

export function PondRipples({
  sx,
  sy,
  progress,
}: {
  sx: number;
  sy: number; // center of pond
  progress: SharedValue<number>;
}) {
  return (
    <Group>
      <PondRing sx={sx} sy={sy} phase={0} progress={progress} />
      <PondRing sx={sx} sy={sy} phase={0.5} progress={progress} />
    </Group>
  );
}

function PondRing({
  sx, sy, phase, progress,
}: {
  sx: number; sy: number; phase: number;
  progress: SharedValue<number>;
}) {
  const r = useDerivedValue(() => {
    const t = (progress.value * 0.8 + phase) % 1;
    return t * 10;
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * 0.8 + phase) % 1;
    return (1 - t) * 0.2;
  });
  // Flatten into ellipse for isometric
  const scaleY = 0.45;
  const transform = useDerivedValue(() => [
    { translateX: sx },
    { translateY: sy },
    { scaleX: r.value },
    { scaleY: r.value * scaleY },
    { translateX: -sx },
    { translateY: -sy },
  ]);

  return (
    <Path
      path={(() => {
        const p = Skia.Path.Make();
        p.addCircle(sx, sy, 1);
        return p;
      })()}
      color="rgba(140,190,230,0.8)"
      style="stroke"
      strokeWidth={0.8}
      opacity={opacity}
      transform={transform}
    />
  );
}

// ── Lantern glow effect (night) ──

export function LanternGlow({
  sx,
  sy,
  isNight,
  progress,
}: {
  sx: number;
  sy: number; // center of lantern light
  isNight: boolean;
  progress: SharedValue<number>;
}) {
  const glowR = useDerivedValue(() => {
    const base = isNight ? 14 : 8;
    return base + Math.sin(progress.value * Math.PI * 4) * 2;
  });
  const opacity = useDerivedValue(() => {
    const base = isNight ? 0.2 : 0.08;
    return base + Math.sin(progress.value * Math.PI * 3) * 0.05;
  });
  const glowColor = isNight ? 'rgba(240,196,120,1)' : 'rgba(240,196,120,1)';

  return (
    <Group>
      <Circle cx={sx} cy={sy} r={glowR} color={glowColor} opacity={opacity} />
      {isNight && (
        <Circle cx={sx} cy={sy} r={useDerivedValue(() => glowR.value * 0.5)} color="rgba(255,220,150,0.15)" />
      )}
    </Group>
  );
}

// ── Tree leaf rustle (subtle sway of canopy) ──

export function TreeRustle({
  sx,
  sy,
  progress,
}: {
  sx: number;
  sy: number; // base of tree trunk
  progress: SharedValue<number>;
}) {
  // Small falling leaves
  const leaves = [
    { phase: 0, xOff: -8, speed: 0.6 },
    { phase: 0.5, xOff: 5, speed: 0.5 },
  ];

  return (
    <Group>
      {leaves.map((l, i) => (
        <FallingLeaf key={`tl-${i}`} sx={sx + l.xOff} sy={sy - 28} phase={l.phase} speed={l.speed} progress={progress} />
      ))}
    </Group>
  );
}

// ── Magic lantern particles effect ──

export function MagicLanternParticles({
  sx,
  sy,
  progress,
}: {
  sx: number;
  sy: number;
  progress: SharedValue<number>;
}) {
  const particles = [
    { phase: 0, xOff: -3, speed: 0.7 },
    { phase: 0.33, xOff: 2, speed: 0.6 },
    { phase: 0.66, xOff: -1, speed: 0.8 },
  ];

  return (
    <Group>
      {particles.map((p, i) => (
        <MagicParticle key={`mp-${i}`} sx={sx + p.xOff} sy={sy} phase={p.phase} speed={p.speed} progress={progress} />
      ))}
    </Group>
  );
}

function MagicParticle({
  sx, sy, phase, speed, progress,
}: {
  sx: number; sy: number; phase: number; speed: number;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return sx + Math.sin(t * Math.PI * 3) * 6;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return sy - t * 20;
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return t < 0.15 ? t * 5 : (1 - t) * 0.6;
  });
  return <Circle cx={cx} cy={cy} r={1.2} color="rgba(180,120,255,0.7)" opacity={opacity} />;
}

// ── Wishing well sparkle effect ──

export function WishingWellSparkle({
  sx,
  sy,
  progress,
}: {
  sx: number;
  sy: number;
  progress: SharedValue<number>;
}) {
  const glowR = useDerivedValue(() => {
    return 4 + Math.sin(progress.value * Math.PI * 3) * 2;
  });
  const opacity = useDerivedValue(() => {
    return 0.1 + Math.sin(progress.value * Math.PI * 5) * 0.08;
  });

  return (
    <Group>
      <Circle cx={sx} cy={sy} r={glowR} color="rgba(240,220,100,1)" opacity={opacity} />
    </Group>
  );
}

function FallingLeaf({
  sx, sy, phase, speed, progress,
}: {
  sx: number; sy: number; phase: number; speed: number;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return sx + Math.sin(t * Math.PI * 4) * 5;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return sy + t * 30;
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return t < 0.1 ? t * 8 : t > 0.8 ? (1 - t) * 4 : 0.5;
  });
  return <Circle cx={cx} cy={cy} r={1.5} color="rgba(120,180,100,0.5)" opacity={opacity} />;
}
