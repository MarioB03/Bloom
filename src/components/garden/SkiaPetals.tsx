import React from 'react';
import { Group, Path, Circle, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { Season } from './gardenSeasons';

// ── Seasonal particles rendered in Skia canvas ──

interface SeasonalParticlesProps {
  canvasW: number;
  canvasH: number;
  season: Season;
  count: number;
  color: string;
  progress: SharedValue<number>;
}

export function SeasonalParticles({ canvasW, canvasH, season, count, color, progress }: SeasonalParticlesProps) {
  if (count === 0) return null;

  // Generate stable particle configs
  const particles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      startX: (i * 97.3 + 23) % canvasW,
      phase: i * 0.7 + (i * i * 0.13) % 1,
      speed: 0.3 + (i * 0.37) % 0.4,
      size: 2 + (i % 3),
      drift: ((i * 53) % 40) - 20, // horizontal drift range
    }));
  }, [count, canvasW]);

  return (
    <Group>
      {particles.map((p, i) => {
        switch (season) {
          case 'spring':
            return <BlossomPetal key={`bp-${i}`} canvasH={canvasH} config={p} color={color} progress={progress} />;
          case 'autumn':
            return <AutumnLeaf key={`al-${i}`} canvasH={canvasH} config={p} color={color} progress={progress} />;
          case 'winter':
            return <Snowflake key={`sf-${i}`} canvasH={canvasH} config={p} color={color} progress={progress} />;
          default:
            return null;
        }
      })}
    </Group>
  );
}

// ── Blossom petal (spring) ──

function BlossomPetal({
  canvasH,
  config,
  color,
  progress,
}: {
  canvasH: number;
  config: { startX: number; phase: number; speed: number; size: number; drift: number };
  color: string;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * config.speed + config.phase) % 1;
    return config.startX + Math.sin(t * Math.PI * 3) * config.drift;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * config.speed + config.phase) % 1;
    return -10 + t * (canvasH + 20);
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * config.speed + config.phase) % 1;
    return t < 0.05 ? t * 16 : t > 0.9 ? (1 - t) * 8 : 0.55;
  });
  const rotation = useDerivedValue(() => {
    const t = (progress.value * config.speed + config.phase) % 1;
    return [
      { translateX: cx.value },
      { translateY: cy.value },
      { rotate: t * Math.PI * 4 },
    ];
  });

  const petalPath = React.useMemo(() => {
    const p = Skia.Path.Make();
    const s = config.size;
    p.moveTo(0, 0);
    p.cubicTo(s * 0.6, -s * 0.4, s * 0.6, -s, 0, -s * 1.2);
    p.cubicTo(-s * 0.6, -s, -s * 0.6, -s * 0.4, 0, 0);
    p.close();
    return p;
  }, [config.size]);

  return (
    <Group transform={rotation} opacity={opacity}>
      <Path path={petalPath} color={color} />
    </Group>
  );
}

// ── Autumn leaf ──

function AutumnLeaf({
  canvasH,
  config,
  color,
  progress,
}: {
  canvasH: number;
  config: { startX: number; phase: number; speed: number; size: number; drift: number };
  color: string;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.7 + config.phase) % 1;
    return config.startX + Math.sin(t * Math.PI * 2.5) * config.drift * 1.5;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.7 + config.phase) % 1;
    return -10 + t * (canvasH + 20);
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.7 + config.phase) % 1;
    return t < 0.05 ? t * 14 : t > 0.85 ? (1 - t) * 5 : 0.5;
  });
  const transform = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.7 + config.phase) % 1;
    return [
      { translateX: cx.value },
      { translateY: cy.value },
      { rotate: t * Math.PI * 6 }, // tumbles more
    ];
  });

  const leafPath = React.useMemo(() => {
    const p = Skia.Path.Make();
    const s = config.size;
    // Maple-like leaf shape
    p.moveTo(0, s);
    p.lineTo(-s * 0.4, s * 0.3);
    p.lineTo(-s * 0.8, s * 0.4);
    p.lineTo(-s * 0.3, 0);
    p.lineTo(-s * 0.5, -s * 0.4);
    p.lineTo(0, -s * 0.1);
    p.lineTo(s * 0.5, -s * 0.4);
    p.lineTo(s * 0.3, 0);
    p.lineTo(s * 0.8, s * 0.4);
    p.lineTo(s * 0.4, s * 0.3);
    p.close();
    return p;
  }, [config.size]);

  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={leafPath} color={color} />
    </Group>
  );
}

// ── Snowflake (winter) ──

function Snowflake({
  canvasH,
  config,
  color,
  progress,
}: {
  canvasH: number;
  config: { startX: number; phase: number; speed: number; size: number; drift: number };
  color: string;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.5 + config.phase) % 1;
    return config.startX + Math.sin(t * Math.PI * 2) * config.drift * 0.8;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.5 + config.phase) % 1;
    return -5 + t * (canvasH + 15);
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * config.speed * 0.5 + config.phase) % 1;
    return t < 0.05 ? t * 14 : t > 0.9 ? (1 - t) * 8 : 0.65;
  });
  const r = config.size * 0.6;

  return (
    <Group opacity={opacity}>
      {/* Snowflake: small circle with a subtle glow */}
      <Circle cx={cx} cy={cy} r={r + 1} color="rgba(200,220,255,0.15)" />
      <Circle cx={cx} cy={cy} r={r} color={color} />
    </Group>
  );
}
