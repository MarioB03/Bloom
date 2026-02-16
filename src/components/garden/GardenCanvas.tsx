import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Group,
  Circle,
  Rect,
  LinearGradient as SkiaGradient,
  vec,
  RoundedRect,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { colors } from '@/constants/theme';
import {
  TILE_W,
  TILE_H,
  PlantPlacement,
  DecorationPlacement,
  InteractionMode,
  WaterEffect,
  getActiveGridSize,
  MAX_GRID_SIZE,
} from './gardenTypes';
import {
  toScreen,
  toGrid,
  tileCorners,
  getCenterOffset,
  isoSortKey,
  isPreviewTile,
  inBounds,
} from './gardenUtils';
import { plantMorphology, getEmotionColor, lightenColor, darkenColor } from '@/constants/garden';
import { getCurrentSeason, SEASONAL_THEMES, type Season } from './gardenSeasons';
import { GardenPet, GardenPets } from './GardenPet';
import type { PetType } from './gardenTypes';
import { FountainSpray, PondRipples, LanternGlow, TreeRustle, MagicLanternParticles, WishingWellSparkle } from './DecorationEffects';
import { SeasonalParticles } from './SkiaPetals';

const SCREEN_W = Dimensions.get('window').width;

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

interface GardenCanvasProps {
  plants: PlantPlacement[];
  decorations: DecorationPlacement[];
  streak: number;
  mode: InteractionMode;
  waterEffects: WaterEffect[];
  activePets?: PetType[];
  onTapCell: (gx: number, gy: number) => void;
  onLongPressCell: (gx: number, gy: number) => void;
}

// ────────────────────────────────────────────────────────
// Animated sub-components
// (each can use hooks because they're real components)
// ────────────────────────────────────────────────────────

/** A single rain drop falling from above onto the plant */
function FallingDrop({
  sx,
  topY,
  baseY,
  xOffset,
  phase,
  speed,
  progress,
}: {
  sx: number;
  topY: number;
  baseY: number;
  xOffset: number;
  phase: number;
  speed: number;
  progress: SharedValue<number>;
}) {
  const fallDist = baseY - topY + 25;
  const cy = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return topY - 25 + t * fallDist;
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) * 6.5 : 0.85;
  });
  return <Circle cx={sx + xOffset} cy={cy} r={1.8} color="rgba(90,170,230,0.9)" opacity={opacity} />;
}

/** Expanding ripple ring at the plant base */
function SplashRing({
  sx,
  baseY,
  phase,
  speed,
  progress,
}: {
  sx: number;
  baseY: number;
  phase: number;
  speed: number;
  progress: SharedValue<number>;
}) {
  const r = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return t * 16;
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * speed + phase) % 1;
    return (1 - t) * 0.45;
  });
  // Flatten ring into an ellipse for isometric feel
  const ry = useDerivedValue(() => r.value * 0.45);
  return (
    <Path
      path={(() => {
        // We can't animate path shapes, so use a circle and rely on opacity
        const p = Skia.Path.Make();
        // Static ellipse; animated via Group scale would be ideal but
        // we approximate with a circle stroke
        p.addCircle(sx, baseY, 1);
        return p;
      })()}
      color="rgba(90,170,230,1)"
      opacity={opacity}
      style="stroke"
      strokeWidth={1.5}
      transform={useDerivedValue(() => [
        { translateX: sx },
        { translateY: baseY },
        { scaleX: r.value },
        { scaleY: ry.value },
        { translateX: -sx },
        { translateY: -baseY },
      ])}
    />
  );
}

/** Spray particle that arcs upward then falls */
function SprayDrop({
  sx,
  baseY,
  angle,
  speed,
  progress,
}: {
  sx: number;
  baseY: number;
  angle: number;
  speed: number;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = (progress.value * speed + angle * 0.15) % 1;
    return sx + Math.cos(angle) * t * 14;
  });
  const cy = useDerivedValue(() => {
    const t = (progress.value * speed + angle * 0.15) % 1;
    // Parabolic arc: goes up then comes back down
    return baseY - t * 18 + t * t * 24;
  });
  const opacity = useDerivedValue(() => {
    const t = (progress.value * speed + angle * 0.15) % 1;
    return (1 - t) * 0.75;
  });
  return <Circle cx={cx} cy={cy} r={1.3} color="rgba(120,190,240,0.85)" opacity={opacity} />;
}

/** Full water splash animation: rain + ripples + spray */
function WaterSplash({
  sx,
  topY,
  baseY,
  progress,
}: {
  sx: number;
  topY: number;
  baseY: number;
  progress: SharedValue<number>;
}) {
  // Falling rain drops (staggered)
  const rainPhases = [0, 0.2, 0.4, 0.6, 0.8];
  const rainOffsets = [-4, 2, -1, 3, 0];

  // Splash rings (staggered)
  const ringPhases = [0, 0.33, 0.66];

  // Spray particles (different angles)
  const sprayAngles = [0.3, 1.2, 2.1, 3.0, 3.9, 4.8];

  return (
    <Group>
      {/* Rain drops */}
      {rainPhases.map((phase, i) => (
        <FallingDrop
          key={`rain-${i}`}
          sx={sx}
          topY={topY}
          baseY={baseY}
          xOffset={rainOffsets[i]}
          phase={phase}
          speed={6}
          progress={progress}
        />
      ))}

      {/* Ripple rings at base */}
      {ringPhases.map((phase, i) => (
        <SplashRing
          key={`ring-${i}`}
          sx={sx}
          baseY={baseY}
          phase={phase}
          speed={3}
          progress={progress}
        />
      ))}

      {/* Upward spray */}
      {sprayAngles.map((angle, i) => (
        <SprayDrop
          key={`spray-${i}`}
          sx={sx}
          baseY={baseY}
          angle={angle}
          speed={5}
          progress={progress}
        />
      ))}
    </Group>
  );
}

/** Animated butterfly that flutters through the garden */
function AnimatedButterfly({
  canvasW,
  canvasH,
  yZone,
  wingColor,
  speed,
  phase,
  progress,
}: {
  canvasW: number;
  canvasH: number;
  yZone: number; // 0-1 vertical position band
  wingColor: string;
  speed: number;
  phase: number;
  progress: SharedValue<number>;
}) {
  // Lissajous flight path
  const cx = useDerivedValue(() => {
    const t = progress.value * speed + phase;
    return (Math.sin(t * 1.3) * 0.35 + 0.5) * canvasW;
  });
  const cy = useDerivedValue(() => {
    const t = progress.value * speed + phase;
    const baseY = canvasH * (0.3 + yZone * 0.5);
    return baseY + Math.sin(t * 2.1) * canvasH * 0.1;
  });
  // Wing flap: rapid scale oscillation on X axis
  const wingScale = useDerivedValue(() => {
    return 0.3 + Math.abs(Math.sin(progress.value * 30 + phase * 5)) * 0.7;
  });

  const wingPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Left wing
    p.moveTo(0, 0);
    p.cubicTo(-5, -5, -8, -3, -6, 1);
    p.cubicTo(-8, 4, -4, 5, 0, 0);
    // Right wing
    p.moveTo(0, 0);
    p.cubicTo(5, -5, 8, -3, 6, 1);
    p.cubicTo(8, 4, 4, 5, 0, 0);
    return p;
  }, []);

  const transform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
    { scaleX: wingScale.value },
    { scaleY: 1 },
  ]);

  return (
    <Group transform={transform}>
      <Path path={wingPath} color={wingColor} />
      {/* Body */}
      <Rect x={-0.5} y={-2} width={1} height={4} color="rgba(60,50,40,0.7)" />
    </Group>
  );
}

/** Animated firefly for night scenes */
function AnimatedFirefly({
  canvasW,
  canvasH,
  phase,
  progress,
}: {
  canvasW: number;
  canvasH: number;
  phase: number;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const t = progress.value * 0.8 + phase;
    return (Math.sin(t * 1.7 + phase * 3) * 0.4 + 0.5) * canvasW;
  });
  const cy = useDerivedValue(() => {
    const t = progress.value * 0.8 + phase;
    return canvasH * 0.35 + Math.sin(t * 2.3 + phase) * canvasH * 0.25;
  });
  const glowR = useDerivedValue(() => {
    return 3 + Math.sin(progress.value * 8 + phase * 7) * 2;
  });
  const opacity = useDerivedValue(() => {
    return 0.3 + Math.sin(progress.value * 6 + phase * 5) * 0.3;
  });

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={glowR} color="rgba(240,220,100,0.15)" opacity={opacity} />
      <Circle cx={cx} cy={cy} r={1.5} color="rgba(240,220,100,0.8)" opacity={opacity} />
    </Group>
  );
}

/** Animated cloud */
function AnimatedCloud({
  baseX,
  baseY,
  scale,
  speed,
  canvasW,
  isNight,
  progress,
}: {
  baseX: number;
  baseY: number;
  scale: number;
  speed: number;
  canvasW: number;
  isNight: boolean;
  progress: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const range = canvasW + 120;
    return ((baseX + progress.value * speed * canvasW) % range) - 60;
  });
  const cy = useDerivedValue(
    () => baseY + Math.sin(progress.value * speed * 3 + baseX * 0.01) * 4
  );
  const cloudColor = isNight ? 'rgba(180,180,210,0.08)' : 'rgba(255,255,255,0.18)';

  // Pre-build cloud path (static shape, animated position via Group)
  const cloudPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addOval({ x: -20 * scale, y: -6 * scale, width: 40 * scale, height: 12 * scale });
    p.addOval({ x: -12 * scale, y: -14 * scale, width: 28 * scale, height: 16 * scale });
    p.addOval({ x: 5 * scale, y: -9 * scale, width: 18 * scale, height: 10 * scale });
    return p;
  }, [scale]);

  const transform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
  ]);

  return (
    <Group transform={transform}>
      <Path path={cloudPath} color={cloudColor} />
    </Group>
  );
}

/** Animated twinkling star */
function AnimatedStar({
  cx,
  cy,
  r,
  phase,
  progress,
}: {
  cx: number;
  cy: number;
  r: number;
  phase: number;
  progress: SharedValue<number>;
}) {
  const opacity = useDerivedValue(
    () => 0.25 + Math.sin(progress.value * 12 + phase) * 0.25 + 0.1
  );
  return <Circle cx={cx} cy={cy} r={r} color="rgba(255,255,240,1)" opacity={opacity} />;
}

// ────────────────────────────────────────────────────────
// Path builders (static helpers)
// ────────────────────────────────────────────────────────

function makeTilePath(gx: number, gy: number, ox: number, oy: number) {
  const c = tileCorners(gx, gy, ox, oy);
  const p = Skia.Path.Make();
  p.moveTo(c.top.x, c.top.y);
  p.lineTo(c.right.x, c.right.y);
  p.lineTo(c.bottom.x, c.bottom.y);
  p.lineTo(c.left.x, c.left.y);
  p.close();
  return p;
}

function makeStemPath(sx: number, baseY: number, height: number) {
  const p = Skia.Path.Make();
  const topY = baseY - height;
  p.moveTo(sx, baseY);
  p.cubicTo(sx - 3, baseY - height * 0.3, sx + 3, baseY - height * 0.7, sx, topY);
  return p;
}

function makeLeafPath(cx: number, cy: number, w: number, h: number, angle: number) {
  const p = Skia.Path.Make();
  p.moveTo(0, 0);
  p.cubicTo(w * 0.5, -h * 0.3, w * 0.5, -h * 0.7, 0, -h);
  p.cubicTo(-w * 0.5, -h * 0.7, -w * 0.5, -h * 0.3, 0, 0);
  p.close();
  const m = Skia.Matrix();
  m.translate(cx, cy);
  m.rotate(angle);
  p.transform(m);
  return p;
}

// ────────────────────────────────────────────────────────
// Draw plant (returns static Skia elements — sway added via Group)
// ────────────────────────────────────────────────────────

function drawPlant(
  ox: number,
  oy: number,
  plant: PlantPlacement
): { elements: React.ReactNode[]; sx: number; baseY: number; stemH: number } {
  const { gx, gy, emotion, intensity, growthStage, wateredToday } = plant;
  const morph = plantMorphology[emotion];
  const emotionColor = getEmotionColor(emotion);
  const lightColor = lightenColor(emotionColor, 0.3);
  const darkColor = darkenColor(emotionColor, 0.3);
  const stemColor = wateredToday ? colors.secondary[500] : colors.secondary[300];
  const leafColor = wateredToday ? '#6B8B6A' : '#8A9B80';

  const { sx, sy } = toScreen(gx, gy, ox, oy);
  const baseY = sy + TILE_H / 4;
  const key = `p-${gx}-${gy}`;
  const elements: React.ReactNode[] = [];

  // Petal scale factor: watered plants are full size, unwatered shrink
  const petalScale = wateredToday ? 1.0 : 0.75;

  const [minH, maxH] = morph.stemHeight;
  const hProgress = Math.min(growthStage / 5, 1);
  const stemH = minH + (maxH - minH) * hProgress;

  if (growthStage === 0) {
    elements.push(<Circle key={`${key}-seed`} cx={sx} cy={baseY - 3} r={3.5} color={darkColor} />);
    return { elements, sx, baseY, stemH: 0 };
  }

  // Shadow
  const shadowW = 8 + growthStage * 2;
  elements.push(
    <Path
      key={`${key}-sh`}
      path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - shadowW, y: baseY - 2, width: shadowW * 2, height: 6 }); return p; })()}
      color="rgba(0,0,0,0.1)"
    />
  );

  // Watered glow
  if (wateredToday) {
    elements.push(
      <Circle key={`${key}-wg`} cx={sx} cy={baseY - stemH * 0.5} r={stemH * 0.45} color="rgba(126,180,220,0.10)" />
    );
  }

  // Stem
  elements.push(
    <Path key={`${key}-st`} path={makeStemPath(sx, baseY, stemH)} color={stemColor} style="stroke" strokeWidth={2.5} strokeCap="round" />
  );

  // Leaves
  const visibleLeaves = growthStage < 2 ? 1 : growthStage < 3 ? 2 : morph.leafCount;
  for (let i = 0; i < visibleLeaves; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const yFrac = 0.3 + (i / morph.leafCount) * 0.4;
    const ly = baseY - stemH * yFrac;
    const a = side * (0.5 + i * 0.15);
    const [lw, lh] = morph.leafSize;
    elements.push(
      <Path key={`${key}-l${i}`} path={makeLeafPath(sx + side * 4, ly, lw, lh, a)} color={i % 2 === 0 ? leafColor : lightenColor(leafColor, 0.2)} />
    );
  }

  // Bloom
  if (growthStage >= 3) {
    const topY = baseY - stemH;
    const visiblePetals =
      growthStage === 3 ? Math.ceil(morph.petalCount * 0.4) :
      growthStage === 4 ? Math.ceil(morph.petalCount * 0.7) :
      morph.petalCount;

    const petalR = morph.petalSize * (0.7 + intensity * 0.06) * petalScale;
    const spread = morph.petalSpread * 0.8 * petalScale;

    for (let i = 0; i < visiblePetals; i++) {
      const a = ((Math.PI * 2) / morph.petalCount) * i - Math.PI / 2;
      elements.push(
        <Circle key={`${key}-pe${i}`} cx={sx + Math.cos(a) * spread} cy={topY + Math.sin(a) * spread} r={petalR} color={i % 2 === 0 ? emotionColor : lightColor} />
      );
    }

    // Center
    elements.push(<Circle key={`${key}-ct`} cx={sx} cy={topY} r={petalR * 0.7} color={darkColor} />);

    // Sparkles (watered & grown)
    if (wateredToday && growthStage >= 4) {
      [{ dx: spread * 0.6, dy: -spread * 0.5 }, { dx: -spread * 0.5, dy: -spread * 0.6 }, { dx: spread * 0.2, dy: spread * 0.4 }].forEach((sp, si) =>
        elements.push(<Circle key={`${key}-sp${si}`} cx={sx + sp.dx} cy={topY + sp.dy} r={1.5} color="#F5D48A" />)
      );
    }

    // Unwatered: small wilted indicator
    if (!wateredToday) {
      elements.push(
        <Circle key={`${key}-thirst`} cx={sx + spread * 0.5} cy={topY - spread * 0.6} r={2.5} color="rgba(100,170,220,0.35)" />
      );
    }
  }

  return { elements, sx, baseY, stemH };
}

// ────────────────────────────────────────────────────────
// Draw decoration (static)
// ────────────────────────────────────────────────────────

function drawDecoration(ox: number, oy: number, dec: DecorationPlacement): React.ReactNode[] {
  const { gx, gy, type } = dec;
  const { sx, sy } = toScreen(gx, gy, ox, oy);
  const k = `d-${gx}-${gy}`;
  const el: React.ReactNode[] = [];

  el.push(<Path key={`${k}-sh`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 6, y: sy, width: 12, height: 5 }); return p; })()} color="rgba(0,0,0,0.06)" />);

  switch (type) {
    case 'stone':
      el.push(<Path key={`${k}-b`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 7, y: sy - 8, width: 14, height: 10 }); return p; })()} color={colors.neutral[400]} />);
      el.push(<Path key={`${k}-h`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 4, y: sy - 7, width: 6, height: 4 }); return p; })()} color={colors.neutral[300]} />);
      break;
    case 'mushroom':
      el.push(<Rect key={`${k}-s`} x={sx - 1.5} y={sy - 8} width={3} height={8} color="#D6CCC2" />);
      el.push(<Path key={`${k}-c`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 7, y: sy - 14, width: 14, height: 9 }); return p; })()} color="#C75450" />);
      el.push(<Circle key={`${k}-d1`} cx={sx - 3} cy={sy - 11} r={1.5} color="#FFF" />);
      el.push(<Circle key={`${k}-d2`} cx={sx + 3} cy={sy - 10} r={1} color="#FFF" />);
      break;
    case 'lantern':
      el.push(<Rect key={`${k}-po`} x={sx - 1} y={sy - 20} width={2} height={20} color={colors.neutral[600]} />);
      el.push(<RoundedRect key={`${k}-la`} x={sx - 5} y={sy - 24} width={10} height={8} r={2} color="#F0C478" />);
      el.push(<Circle key={`${k}-gl`} cx={sx} cy={sy - 20} r={10} color="rgba(240,196,120,0.18)" />);
      break;
    case 'bench':
      el.push(<Rect key={`${k}-se`} x={sx - 10} y={sy - 7} width={20} height={3} color={colors.primary[300]} />);
      el.push(<Rect key={`${k}-l1`} x={sx - 8} y={sy - 4} width={2} height={5} color={colors.primary[400]} />);
      el.push(<Rect key={`${k}-l2`} x={sx + 6} y={sy - 4} width={2} height={5} color={colors.primary[400]} />);
      el.push(<Rect key={`${k}-bk`} x={sx - 10} y={sy - 14} width={20} height={2} color={colors.primary[200]} />);
      break;
    case 'birdbath':
      el.push(<Rect key={`${k}-ba`} x={sx - 2} y={sy - 12} width={4} height={12} color={colors.neutral[400]} />);
      el.push(<Path key={`${k}-bw`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 9, y: sy - 16, width: 18, height: 6 }); return p; })()} color={colors.neutral[300]} />);
      el.push(<Path key={`${k}-wa`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 6, y: sy - 15, width: 12, height: 4 }); return p; })()} color="rgba(126,158,181,0.5)" />);
      break;
    case 'butterfly_house':
      el.push(<Rect key={`${k}-po`} x={sx - 1} y={sy - 20} width={2} height={20} color={colors.primary[400]} />);
      el.push(<RoundedRect key={`${k}-ho`} x={sx - 6} y={sy - 28} width={12} height={12} r={2} color={colors.primary[200]} />);
      el.push(<Path key={`${k}-ro`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 8, sy - 28); p.lineTo(sx, sy - 34); p.lineTo(sx + 8, sy - 28); p.close(); return p; })()} color={colors.primary[300]} />);
      el.push(<Circle key={`${k}-hl`} cx={sx} cy={sy - 23} r={2} color={colors.neutral[600]} />);
      break;
    case 'fountain':
      el.push(<Path key={`${k}-bs`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 12, y: sy - 6, width: 24, height: 10 }); return p; })()} color={colors.neutral[300]} />);
      el.push(<Path key={`${k}-fw`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 9, y: sy - 5, width: 18, height: 7 }); return p; })()} color="rgba(126,158,181,0.4)" />);
      el.push(<Rect key={`${k}-co`} x={sx - 2} y={sy - 18} width={4} height={14} color={colors.neutral[400]} />);
      break;
    case 'gnome':
      el.push(<Path key={`${k}-bo`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 5, y: sy - 12, width: 10, height: 12 }); return p; })()} color="#A0522D" />);
      el.push(<Path key={`${k}-ha`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 5, sy - 12); p.lineTo(sx, sy - 22); p.lineTo(sx + 5, sy - 12); p.close(); return p; })()} color="#C75450" />);
      el.push(<Circle key={`${k}-fa`} cx={sx} cy={sy - 10} r={3} color="#FCEBC4" />);
      break;
    case 'pond':
      // Oval water surface
      el.push(<Path key={`${k}-w1`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 14, y: sy - 6, width: 28, height: 12 }); return p; })()} color="rgba(100,160,200,0.35)" />);
      el.push(<Path key={`${k}-w2`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 11, y: sy - 4, width: 22, height: 8 }); return p; })()} color="rgba(120,180,220,0.45)" />);
      // Edge stones
      el.push(<Circle key={`${k}-s1`} cx={sx - 12} cy={sy - 1} r={2.5} color="#B0A898" />);
      el.push(<Circle key={`${k}-s2`} cx={sx + 11} cy={sy} r={2} color="#B0A898" />);
      el.push(<Circle key={`${k}-s3`} cx={sx - 5} cy={sy + 4} r={2} color="#A8A090" />);
      // Lily pad
      el.push(<Path key={`${k}-lp`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx + 2, y: sy - 3, width: 6, height: 4 }); return p; })()} color="#7BA87A" />);
      break;
    case 'tree':
      // Trunk
      el.push(<Rect key={`${k}-tr`} x={sx - 2} y={sy - 20} width={4} height={20} color="#8B7355" />);
      // Canopy layers
      el.push(<Path key={`${k}-c1`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 12, y: sy - 32, width: 24, height: 16 }); return p; })()} color="#5A8A50" />);
      el.push(<Path key={`${k}-c2`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 9, y: sy - 36, width: 18, height: 14 }); return p; })()} color="#6B9B60" />);
      el.push(<Path key={`${k}-c3`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 6, y: sy - 38, width: 12, height: 10 }); return p; })()} color="#7BAB70" />);
      break;
    case 'wildflowers':
      // Small cluster of colorful flowers
      el.push(<Circle key={`${k}-f1`} cx={sx - 5} cy={sy - 6} r={2.5} color="#E8A0B0" />);
      el.push(<Circle key={`${k}-f2`} cx={sx + 4} cy={sy - 5} r={2} color="#F0C478" />);
      el.push(<Circle key={`${k}-f3`} cx={sx - 1} cy={sy - 8} r={2.5} color="#A0B8E0" />);
      el.push(<Circle key={`${k}-f4`} cx={sx + 2} cy={sy - 3} r={2} color="#E8C0D0" />);
      // Stems
      el.push(<Rect key={`${k}-s1`} x={sx - 5.5} y={sy - 4} width={1} height={4} color="#6B8B6A" />);
      el.push(<Rect key={`${k}-s2`} x={sx + 3.5} y={sy - 3} width={1} height={4} color="#6B8B6A" />);
      el.push(<Rect key={`${k}-s3`} x={sx - 1.5} y={sy - 6} width={1} height={6} color="#6B8B6A" />);
      break;
    case 'bridge':
      // Arched bridge
      el.push(<Path key={`${k}-ar`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 14, sy); p.cubicTo(sx - 8, sy - 10, sx + 8, sy - 10, sx + 14, sy); p.lineTo(sx + 14, sy + 2); p.cubicTo(sx + 8, sy - 7, sx - 8, sy - 7, sx - 14, sy + 2); p.close(); return p; })()} color="#C4A882" />);
      // Rails
      el.push(<Rect key={`${k}-r1`} x={sx - 12} y={sy - 8} width={2} height={6} color="#B09872" />);
      el.push(<Rect key={`${k}-r2`} x={sx + 10} y={sy - 8} width={2} height={6} color="#B09872" />);
      el.push(<Rect key={`${k}-rb`} x={sx - 12} y={sy - 9} width={24} height={1.5} color="#B09872" />);
      break;
    // ── Premium decorations ──
    case 'arch':
      // Flower arch — two posts with a curved top covered in flowers
      el.push(<Rect key={`${k}-lp`} x={sx - 10} y={sy - 22} width={3} height={22} color="#8B7355" />);
      el.push(<Rect key={`${k}-rp`} x={sx + 7} y={sy - 22} width={3} height={22} color="#8B7355" />);
      el.push(<Path key={`${k}-arc`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 10, sy - 22); p.cubicTo(sx - 8, sy - 34, sx + 8, sy - 34, sx + 10, sy - 22); return p; })()} color="#8B7355" style="stroke" strokeWidth={3} strokeCap="round" />);
      // Flowers on the arch
      el.push(<Circle key={`${k}-f1`} cx={sx - 6} cy={sy - 30} r={2.5} color="#E8A0B0" />);
      el.push(<Circle key={`${k}-f2`} cx={sx} cy={sy - 32} r={3} color="#F0C478" />);
      el.push(<Circle key={`${k}-f3`} cx={sx + 6} cy={sy - 30} r={2.5} color="#A0B8E0" />);
      el.push(<Circle key={`${k}-f4`} cx={sx - 3} cy={sy - 31} r={2} color="#E8C0D0" />);
      el.push(<Circle key={`${k}-f5`} cx={sx + 3} cy={sy - 31} r={2} color="#C8E0A0" />);
      break;
    case 'statue':
      // Stone statue — pedestal + abstract figure
      el.push(<Rect key={`${k}-pd`} x={sx - 6} y={sy - 6} width={12} height={6} color={colors.neutral[400]} />);
      el.push(<Rect key={`${k}-b1`} x={sx - 4} y={sy - 10} width={8} height={4} color={colors.neutral[300]} />);
      el.push(<Path key={`${k}-body`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 4, y: sy - 22, width: 8, height: 12 }); return p; })()} color={colors.neutral[400]} />);
      el.push(<Circle key={`${k}-head`} cx={sx} cy={sy - 26} r={4} color={colors.neutral[300]} />);
      // Gleam highlight
      el.push(<Circle key={`${k}-gl`} cx={sx + 1.5} cy={sy - 27} r={1} color="rgba(255,255,255,0.5)" />);
      break;
    case 'swing':
      // Wooden swing — A-frame + seat
      // A-frame posts
      el.push(<Path key={`${k}-fl`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 8, sy); p.lineTo(sx - 2, sy - 28); return p; })()} color="#8B7355" style="stroke" strokeWidth={2} />);
      el.push(<Path key={`${k}-fr`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx + 8, sy); p.lineTo(sx + 2, sy - 28); return p; })()} color="#8B7355" style="stroke" strokeWidth={2} />);
      // Crossbar
      el.push(<Rect key={`${k}-cb`} x={sx - 3} y={sy - 29} width={6} height={2} color="#8B7355" />);
      // Ropes
      el.push(<Path key={`${k}-rl`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 2, sy - 28); p.lineTo(sx - 4, sy - 12); return p; })()} color="#C4A882" style="stroke" strokeWidth={1} />);
      el.push(<Path key={`${k}-rr`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx + 2, sy - 28); p.lineTo(sx + 4, sy - 12); return p; })()} color="#C4A882" style="stroke" strokeWidth={1} />);
      // Seat
      el.push(<Rect key={`${k}-se`} x={sx - 5} y={sy - 13} width={10} height={2.5} color={colors.primary[300]} />);
      break;
    case 'magic_lantern':
      // Ornate lantern with magical glow
      el.push(<Rect key={`${k}-po`} x={sx - 1.5} y={sy - 22} width={3} height={22} color="#6E5A3A" />);
      el.push(<Path key={`${k}-top`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 4, sy - 22); p.lineTo(sx, sy - 27); p.lineTo(sx + 4, sy - 22); p.close(); return p; })()} color="#6E5A3A" />);
      el.push(<RoundedRect key={`${k}-la`} x={sx - 5} y={sy - 22} width={10} height={8} r={2} color="rgba(180,120,255,0.6)" />);
      // Magical glow
      el.push(<Circle key={`${k}-g1`} cx={sx} cy={sy - 18} r={8} color="rgba(180,120,255,0.12)" />);
      el.push(<Circle key={`${k}-g2`} cx={sx} cy={sy - 18} r={12} color="rgba(180,120,255,0.06)" />);
      break;
    case 'windmill':
      // Windmill — tower + blades
      // Tower
      el.push(<Path key={`${k}-tw`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 5, sy); p.lineTo(sx - 3, sy - 28); p.lineTo(sx + 3, sy - 28); p.lineTo(sx + 5, sy); p.close(); return p; })()} color={colors.neutral[300]} />);
      el.push(<Path key={`${k}-ts`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 4, sy); p.lineTo(sx - 2.5, sy - 28); p.lineTo(sx, sy - 28); p.lineTo(sx - 1, sy); p.close(); return p; })()} color={colors.neutral[200]} />);
      // Roof
      el.push(<Path key={`${k}-rf`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 5, sy - 28); p.lineTo(sx, sy - 34); p.lineTo(sx + 5, sy - 28); p.close(); return p; })()} color={colors.primary[300]} />);
      // Blade hub
      el.push(<Circle key={`${k}-hub`} cx={sx} cy={sy - 25} r={2} color={colors.neutral[500]} />);
      // Blades (static X pattern)
      el.push(<Rect key={`${k}-b1`} x={sx - 0.8} y={sy - 38} width={1.6} height={13} color="#C4A882" />);
      el.push(<Rect key={`${k}-b2`} x={sx - 6.5} y={sy - 25.8} width={13} height={1.6} color="#C4A882" />);
      break;
    case 'wishing_well':
      // Circular stone well with a glow
      el.push(<Path key={`${k}-w1`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 10, y: sy - 8, width: 20, height: 10 }); return p; })()} color={colors.neutral[400]} />);
      el.push(<Path key={`${k}-w2`} path={(() => { const p = Skia.Path.Make(); p.addOval({ x: sx - 8, y: sy - 7, width: 16, height: 8 }); return p; })()} color="rgba(80,100,140,0.4)" />);
      // Posts + roof
      el.push(<Rect key={`${k}-p1`} x={sx - 8} y={sy - 20} width={2} height={16} color="#8B7355" />);
      el.push(<Rect key={`${k}-p2`} x={sx + 6} y={sy - 20} width={2} height={16} color="#8B7355" />);
      el.push(<Path key={`${k}-ro`} path={(() => { const p = Skia.Path.Make(); p.moveTo(sx - 10, sy - 18); p.lineTo(sx, sy - 24); p.lineTo(sx + 10, sy - 18); p.close(); return p; })()} color={colors.primary[200]} />);
      // Inner glow
      el.push(<Circle key={`${k}-ig`} cx={sx} cy={sy - 3} r={5} color="rgba(240,220,100,0.15)" />);
      break;
  }
  return el;
}

// ────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────

export function GardenCanvas({
  plants,
  decorations,
  streak,
  mode,
  waterEffects,
  activePets,
  onTapCell,
  onLongPressCell,
}: GardenCanvasProps) {
  // ── Layout measurement ──
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const canvasW = measured?.w ?? SCREEN_W - 32;
  const canvasH = measured?.h ?? 400;

  const activeGridSize = useMemo(() => getActiveGridSize(streak), [streak]);
  const previewGridSize = Math.min(activeGridSize + 1, MAX_GRID_SIZE);

  const { offsetX, offsetY } = useMemo(
    () => getCenterOffset(canvasW, canvasH, previewGridSize),
    [canvasW, canvasH, previewGridSize]
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setMeasured({ w: width, h: height });
  }, []);

  // ── Season & time of day ──
  const season = useMemo(() => getCurrentSeason(), []);
  const seasonTheme = SEASONAL_THEMES[season];

  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 20;
  const isDawn = hour >= 6 && hour < 8;
  const isDusk = hour >= 18 && hour < 20;

  let skyTop: string, skyBottom: string;
  if (isNight) { skyTop = seasonTheme.skyTopNight; skyBottom = seasonTheme.skyBottomNight; }
  else if (isDawn) { skyTop = '#FCEBC4'; skyBottom = '#FBF0EC'; }
  else if (isDusk) { skyTop = '#F0C478'; skyBottom = '#FBF0EC'; }
  else { skyTop = seasonTheme.skyTopDay; skyBottom = seasonTheme.skyBottomDay; }

  const groundColor = seasonTheme.groundColor;

  // ── ANIMATIONS ──

  // Main progress: 0 → 1 over 10s, infinite loop
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Slow sway: 0 → 1 → 0 over 3s
  const swayProgress = useSharedValue(0);
  useEffect(() => {
    swayProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Sun pulse
  const sunBaseR = 14 + Math.min(streak, 10);
  const sunR = useDerivedValue(() => sunBaseR + Math.sin(progress.value * Math.PI * 4) * 2);
  const sunGlowR = useDerivedValue(() => sunBaseR + 8 + Math.sin(progress.value * Math.PI * 2) * 3);

  // 4 sway transforms for plants (different offsets for variety)
  const sway0 = useDerivedValue(() => [
    { rotate: Math.sin(swayProgress.value * Math.PI * 2) * 0.035 },
  ]);
  const sway1 = useDerivedValue(() => [
    { rotate: Math.sin(swayProgress.value * Math.PI * 2 + 1.2) * 0.04 },
  ]);
  const sway2 = useDerivedValue(() => [
    { rotate: Math.sin(swayProgress.value * Math.PI * 2 + 2.4) * 0.03 },
  ]);
  const sway3 = useDerivedValue(() => [
    { rotate: Math.sin(swayProgress.value * Math.PI * 2 + 3.6) * 0.045 },
  ]);
  const swayTransforms = [sway0, sway1, sway2, sway3];

  // 4 sway+bounce transforms for plants being actively watered
  const swayBounce0 = useDerivedValue(() => {
    const s = Math.sin(progress.value * Math.PI * 6) * 0.08 + 1.0;
    return [{ rotate: Math.sin(swayProgress.value * Math.PI * 2) * 0.035 }, { scaleX: s }, { scaleY: s }];
  });
  const swayBounce1 = useDerivedValue(() => {
    const s = Math.sin(progress.value * Math.PI * 6) * 0.08 + 1.0;
    return [{ rotate: Math.sin(swayProgress.value * Math.PI * 2 + 1.2) * 0.04 }, { scaleX: s }, { scaleY: s }];
  });
  const swayBounce2 = useDerivedValue(() => {
    const s = Math.sin(progress.value * Math.PI * 6) * 0.08 + 1.0;
    return [{ rotate: Math.sin(swayProgress.value * Math.PI * 2 + 2.4) * 0.03 }, { scaleX: s }, { scaleY: s }];
  });
  const swayBounce3 = useDerivedValue(() => {
    const s = Math.sin(progress.value * Math.PI * 6) * 0.08 + 1.0;
    return [{ rotate: Math.sin(swayProgress.value * Math.PI * 2 + 3.6) * 0.045 }, { scaleX: s }, { scaleY: s }];
  });
  const swayBounceTransforms = [swayBounce0, swayBounce1, swayBounce2, swayBounce3];

  // ── Water effect lookup ──
  const waterEffectSet = useMemo(() => {
    const s = new Set<string>();
    waterEffects.forEach((e) => s.add(`${e.gx},${e.gy}`));
    return s;
  }, [waterEffects]);

  // ── Build render items ──
  const renderItems = useMemo(() => {
    const items: Array<{
      sortKey: number;
      type: 'tile' | 'preview' | 'plant' | 'decoration';
      gx: number;
      gy: number;
      data?: PlantPlacement | DecorationPlacement;
    }> = [];

    for (let gx = 0; gx < activeGridSize; gx++)
      for (let gy = 0; gy < activeGridSize; gy++)
        items.push({ sortKey: isoSortKey(gx, gy) - 0.5, type: 'tile', gx, gy });

    if (previewGridSize > activeGridSize)
      for (let gx = 0; gx < previewGridSize; gx++)
        for (let gy = 0; gy < previewGridSize; gy++)
          if (isPreviewTile(gx, gy, activeGridSize))
            items.push({ sortKey: isoSortKey(gx, gy) - 0.5, type: 'preview', gx, gy });

    plants.forEach((p) => items.push({ sortKey: isoSortKey(p.gx, p.gy), type: 'plant', gx: p.gx, gy: p.gy, data: p }));
    decorations.forEach((d) => items.push({ sortKey: isoSortKey(d.gx, d.gy), type: 'decoration', gx: d.gx, gy: d.gy, data: d }));

    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [plants, decorations, activeGridSize, previewGridSize]);

  // ── Gestures ──
  const handleTap = useCallback((x: number, y: number) => {
    const grid = toGrid(x, y, offsetX, offsetY);
    onTapCell(grid.gx, grid.gy);
  }, [offsetX, offsetY, onTapCell]);

  const handleLongPress = useCallback((x: number, y: number) => {
    const grid = toGrid(x, y, offsetX, offsetY);
    onLongPressCell(grid.gx, grid.gy);
  }, [offsetX, offsetY, onLongPressCell]);

  const tapGesture = Gesture.Tap().onEnd((e) => { 'worklet'; runOnJS(handleTap)(e.x, e.y); });
  const longPressGesture = Gesture.LongPress().minDuration(400).onEnd((e) => { 'worklet'; runOnJS(handleLongPress)(e.x, e.y); });
  const composed = Gesture.Exclusive(longPressGesture, tapGesture);

  // ── Tile colors (mode-aware) ──
  const getTileColor = useCallback(
    (gx: number, gy: number) => {
      const hasPlant = plants.some((p) => p.gx === gx && p.gy === gy);
      const hasDec = decorations.some((d) => d.gx === gx && d.gy === gy);

      if (mode === 'water' && hasPlant) {
        const plant = plants.find((p) => p.gx === gx && p.gy === gy);
        return plant?.wateredToday ? '#8FB87A' : '#7EB4C8';
      }
      if (mode === 'decorate' && !hasPlant && !hasDec) return '#C8BFA6';
      if (hasPlant) return '#8FB87A';
      if (hasDec) return '#B8AFA0';
      return (gx + gy) % 2 === 0 ? seasonTheme.tileBase1 : seasonTheme.tileBase2;
    },
    [plants, decorations, mode]
  );

  const tileStroke = mode === 'decorate' ? 'rgba(232,169,72,0.6)' : mode === 'water' ? 'rgba(100,170,220,0.5)' : 'rgba(107,139,106,0.25)';

  // ── Cloud data ──
  const cloudData = useMemo(() => {
    if (streak < 3) return [];
    const count = streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
    return Array.from({ length: count }).map((_, i) => ({
      baseX: canvasW * (0.1 + i * 0.35),
      baseY: 22 + i * 14,
      scale: 0.55 + i * 0.15,
      speed: 0.3 + i * 0.15,
    }));
  }, [streak, canvasW]);

  // ── Star data ──
  const starData = useMemo(() => {
    if (!isNight || streak < 5) return [];
    return Array.from({ length: Math.min(streak, 30) }).map((_, i) => ({
      cx: (i * 137.508) % canvasW,
      cy: ((i * 97.3) % (canvasH * 0.35)) + 5,
      r: 0.8 + (i % 3) * 0.4,
      phase: i * 2.3,
    }));
  }, [isNight, streak, canvasW, canvasH]);

  // ── Sparkle particle data ──
  const sparkleData = useMemo(() => {
    if (streak < 10) return [];
    const count = streak >= 21 ? 12 : streak >= 14 ? 6 : 3;
    return Array.from({ length: count }).map((_, i) => ({
      cx: 20 + ((i * 73.7) % (canvasW - 40)),
      cy: canvasH * 0.35 + ((i * 51.3) % (canvasH * 0.55)),
      r: 1 + (i % 3) * 0.5,
      phase: i * 1.9,
    }));
  }, [streak, canvasW, canvasH]);

  // ── Butterfly data ──
  const butterflyColors = ['rgba(200,120,160,0.7)', 'rgba(120,160,220,0.7)', 'rgba(220,180,80,0.7)', 'rgba(140,200,140,0.7)', 'rgba(180,140,220,0.7)'];
  const butterflyData = useMemo(() => {
    if (streak < 2) return [];
    const count = streak >= 18 ? 5 : streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
    return Array.from({ length: count }).map((_, i) => ({
      yZone: 0.1 + (i / count) * 0.7,
      wingColor: butterflyColors[i % butterflyColors.length],
      speed: 0.6 + i * 0.15,
      phase: i * 2.1,
    }));
  }, [streak]);

  // ── Firefly data (night only) ──
  const fireflyData = useMemo(() => {
    if (!isNight || streak < 10) return [];
    const count = streak >= 21 ? 8 : streak >= 14 ? 5 : 3;
    return Array.from({ length: count }).map((_, i) => ({
      phase: i * 1.7,
    }));
  }, [isNight, streak]);

  // ── Decoration effect positions (fountain, pond, lantern, tree) ──
  const decoEffects = useMemo(() => {
    const effects: Array<{ type: string; sx: number; sy: number }> = [];
    for (const d of decorations) {
      const { sx, sy } = toScreen(d.gx, d.gy, offsetX, offsetY);
      if (d.type === 'fountain') effects.push({ type: 'fountain', sx, sy: sy - 18 });
      if (d.type === 'pond') effects.push({ type: 'pond', sx, sy: sy - 2 });
      if (d.type === 'lantern') effects.push({ type: 'lantern', sx, sy: sy - 20 });
      if (d.type === 'tree') effects.push({ type: 'tree', sx, sy });
      if (d.type === 'magic_lantern') effects.push({ type: 'magic_lantern', sx, sy: sy - 18 });
      if (d.type === 'wishing_well') effects.push({ type: 'wishing_well', sx, sy: sy - 3 });
    }
    return effects;
  }, [decorations, offsetX, offsetY]);

  // ── Ground texture details (grass, pebbles, soil patches) ──
  const groundDetails = useMemo(() => {
    const groundTop = canvasH * 0.38;
    const groundBot = canvasH * 0.95;
    const el: React.ReactNode[] = [];

    // Deterministic pseudo-random from seed
    const rand = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    // Grass tufts: small vertical strokes in varying green
    const grassCount = 35;
    const grassDark = darkenColor(groundColor, 0.15);
    const grassLight = lightenColor(groundColor, 0.15);
    for (let i = 0; i < grassCount; i++) {
      const x = rand(i * 3.1) * canvasW;
      const y = groundTop + rand(i * 7.3) * (groundBot - groundTop);
      const h = 3 + rand(i * 5.7) * 4;
      const lean = (rand(i * 11.3) - 0.5) * 3;
      const color = i % 3 === 0 ? grassDark : i % 3 === 1 ? grassLight : seasonTheme.leafTint;
      const p = Skia.Path.Make();
      p.moveTo(x, y);
      p.lineTo(x + lean, y - h);
      el.push(
        <Path key={`gr-${i}`} path={p} color={color} style="stroke" strokeWidth={0.8} strokeCap="round" opacity={0.5} />
      );
    }

    // Small soil/earth patches
    const patchCount = 12;
    for (let i = 0; i < patchCount; i++) {
      const x = rand(i * 13.7 + 50) * canvasW;
      const y = groundTop + rand(i * 17.1 + 50) * (groundBot - groundTop);
      const w = 4 + rand(i * 23.3) * 6;
      const p = Skia.Path.Make();
      p.addOval({ x: x - w / 2, y: y - 1.5, width: w, height: 3 });
      el.push(
        <Path key={`sp-${i}`} path={p} color={darkenColor(groundColor, 0.08)} opacity={0.3} />
      );
    }

    // Tiny pebbles
    const pebbleCount = 10;
    for (let i = 0; i < pebbleCount; i++) {
      const x = rand(i * 19.1 + 100) * canvasW;
      const y = groundTop + rand(i * 23.7 + 100) * (groundBot - groundTop);
      const r = 0.8 + rand(i * 31.3) * 1.2;
      el.push(
        <Circle key={`pb-${i}`} cx={x} cy={y} r={r} color={darkenColor(groundColor, 0.12)} opacity={0.35} />
      );
    }

    return <Group>{el}</Group>;
  }, [canvasW, canvasH, groundColor, seasonTheme.leafTint]);

  return (
    <GestureHandlerRootView style={styles.rootView}>
      <GestureDetector gesture={composed}>
        <View style={styles.container} onLayout={onLayout}>
          {measured && (
            <Canvas style={{ width: canvasW, height: canvasH }}>
              {/* ─── Sky ─── */}
              <Rect x={0} y={0} width={canvasW} height={canvasH}>
                <SkiaGradient start={vec(canvasW / 2, 0)} end={vec(canvasW / 2, canvasH * 0.5)} colors={[skyTop, skyBottom]} />
              </Rect>

              {/* ─── Ground ─── */}
              {/* Base: gradient from lighter top to slightly darker bottom */}
              <Rect x={0} y={canvasH * 0.35} width={canvasW} height={canvasH * 0.65}>
                <SkiaGradient
                  start={vec(canvasW / 2, canvasH * 0.35)}
                  end={vec(canvasW / 2, canvasH)}
                  colors={[lightenColor(groundColor, 0.06), groundColor, darkenColor(groundColor, 0.06)]}
                />
              </Rect>
              {/* Horizon blend: sky fades into ground */}
              <Rect x={0} y={canvasH * 0.33} width={canvasW} height={canvasH * 0.1}>
                <SkiaGradient
                  start={vec(canvasW / 2, canvasH * 0.33)}
                  end={vec(canvasW / 2, canvasH * 0.43)}
                  colors={[skyBottom, 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                />
              </Rect>
              {/* Highlight strip at horizon */}
              <Rect x={0} y={canvasH * 0.35} width={canvasW} height={canvasH * 0.03} color={seasonTheme.groundHighlight} />
              {/* Ground texture: grass tufts, soil patches, pebbles */}
              {groundDetails}

              {/* ─── Animated stars ─── */}
              {starData.map((s, i) => (
                <AnimatedStar key={`star-${i}`} cx={s.cx} cy={s.cy} r={s.r} phase={s.phase} progress={progress} />
              ))}

              {/* ─── Animated sun ─── */}
              {!isNight && streak >= 2 && (
                <Group>
                  <Circle cx={canvasW - 45} cy={35} r={sunGlowR} color="rgba(248,200,80,0.08)" />
                  <Circle cx={canvasW - 45} cy={35} r={sunR} color="#F5D48A" />
                  <Circle cx={canvasW - 45} cy={35} r={useDerivedValue(() => sunR.value * 0.75)} color="#FCEBC4" />
                </Group>
              )}
              {/* Moon */}
              {isNight && (
                <Group>
                  <Circle cx={canvasW - 45} cy={35} r={14} color="rgba(220,220,240,0.12)" />
                  <Circle cx={canvasW - 45} cy={35} r={10} color="#E8E0E8" />
                </Group>
              )}

              {/* ─── Animated clouds ─── */}
              {cloudData.map((cl, i) => (
                <AnimatedCloud
                  key={`cloud-${i}`}
                  baseX={cl.baseX}
                  baseY={cl.baseY}
                  scale={cl.scale}
                  speed={cl.speed}
                  canvasW={canvasW}
                  isNight={isNight}
                  progress={progress}
                />
              ))}

              {/* ─── Distant hills ─── */}
              {streak >= 5 && (
                <Group>
                  <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(0, canvasH * 0.4); p.cubicTo(canvasW * 0.15, canvasH * 0.3, canvasW * 0.35, canvasH * 0.33, canvasW * 0.55, canvasH * 0.39); p.lineTo(0, canvasH * 0.4); p.close(); return p; })()} color="rgba(139,168,136,0.18)" />
                  <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(canvasW * 0.35, canvasH * 0.4); p.cubicTo(canvasW * 0.55, canvasH * 0.32, canvasW * 0.75, canvasH * 0.34, canvasW, canvasH * 0.39); p.lineTo(canvasW, canvasH * 0.4); p.close(); return p; })()} color="rgba(139,168,136,0.12)" />
                </Group>
              )}

              {/* ─── Rainbow (streak 21+) ─── */}
              {streak >= 21 && !isNight && (
                <Group>
                  {['rgba(255,100,100,0.07)', 'rgba(255,200,100,0.07)', 'rgba(100,255,100,0.07)', 'rgba(100,150,255,0.07)'].map((col, i) => (
                    <Path key={`rb-${i}`} path={(() => { const p = Skia.Path.Make(); const r = canvasW * 0.45 - i * 5; p.addArc({ x: canvasW * 0.5 - r, y: canvasH * 0.05 - r * 0.3, width: r * 2, height: r * 1.2 }, 180, 180); return p; })()} color={col} style="stroke" strokeWidth={4} />
                  ))}
                </Group>
              )}

              {/* ─── Tiles, plants, decorations ─── */}
              {renderItems.map((item) => {
                if (item.type === 'preview') {
                  return (
                    <Group key={`pv-${item.gx}-${item.gy}`}>
                      <Path path={makeTilePath(item.gx, item.gy, offsetX, offsetY)} color="rgba(160,150,140,0.2)" />
                      <Path path={makeTilePath(item.gx, item.gy, offsetX, offsetY)} color="rgba(140,130,120,0.3)" style="stroke" strokeWidth={0.8} />
                    </Group>
                  );
                }

                if (item.type === 'tile') {
                  const tp = makeTilePath(item.gx, item.gy, offsetX, offsetY);
                  return (
                    <Group key={`t-${item.gx}-${item.gy}`}>
                      <Path path={tp} color={getTileColor(item.gx, item.gy)} />
                      <Path path={tp} color={tileStroke} style="stroke" strokeWidth={0.5} />
                    </Group>
                  );
                }

                if (item.type === 'plant') {
                  const plantData = item.data as PlantPlacement;
                  const { elements, sx, baseY, stemH } = drawPlant(offsetX, offsetY, plantData);
                  const swayIdx = (item.gx * 3 + item.gy) % 4;
                  const hasWater = waterEffectSet.has(`${item.gx},${item.gy}`);
                  // Watered = full opacity, unwatered = faded
                  const plantOpacity = plantData.wateredToday ? 1.0 : 0.65;

                  // Pick sway or sway+bounce transform
                  const plantTransform = hasWater
                    ? swayBounceTransforms[swayIdx]
                    : swayTransforms[swayIdx];

                  return (
                    <Group key={`pg-${item.gx}-${item.gy}`} opacity={plantOpacity}>
                      <Group transform={plantTransform} origin={vec(sx, baseY)}>
                        {elements}
                      </Group>
                      {hasWater && stemH > 0 && (
                        <WaterSplash sx={sx} topY={baseY - stemH - 15} baseY={baseY} progress={progress} />
                      )}
                    </Group>
                  );
                }

                if (item.type === 'decoration') {
                  return (
                    <Group key={`dg-${item.gx}-${item.gy}`}>
                      {drawDecoration(offsetX, offsetY, item.data as DecorationPlacement)}
                    </Group>
                  );
                }
                return null;
              })}

              {/* ─── Animated butterflies ─── */}
              {butterflyData.map((b, i) => (
                <AnimatedButterfly
                  key={`butterfly-${i}`}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  yZone={b.yZone}
                  wingColor={b.wingColor}
                  speed={b.speed}
                  phase={b.phase}
                  progress={progress}
                />
              ))}

              {/* ─── Animated fireflies (night) ─── */}
              {fireflyData.map((f, i) => (
                <AnimatedFirefly
                  key={`firefly-${i}`}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  phase={f.phase}
                  progress={progress}
                />
              ))}

              {/* ─── Animated sparkle particles ─── */}
              {sparkleData.map((s, i) => (
                <AnimatedStar key={`sparkle-${i}`} cx={s.cx} cy={s.cy} r={s.r} phase={s.phase} progress={progress} />
              ))}

              {/* ─── Fence posts around active edge ─── */}
              {streak >= 3 && (() => {
                const posts: React.ReactNode[] = [];
                for (let i = 0; i < activeGridSize; i++) {
                  const r = toScreen(activeGridSize - 0.5, i, offsetX, offsetY);
                  posts.push(<Rect key={`fr-${i}`} x={r.sx - 1} y={r.sy - 7} width={2} height={7} color="rgba(160,120,80,0.3)" />);
                  const b = toScreen(i, activeGridSize - 0.5, offsetX, offsetY);
                  posts.push(<Rect key={`fb-${i}`} x={b.sx - 1} y={b.sy - 7} width={2} height={7} color="rgba(160,120,80,0.3)" />);
                }
                return posts;
              })()}

              {/* ─── Animated decoration effects ─── */}
              {decoEffects.map((de, i) => {
                if (de.type === 'fountain')
                  return <FountainSpray key={`fxf-${i}`} sx={de.sx} sy={de.sy} progress={progress} />;
                if (de.type === 'pond')
                  return <PondRipples key={`fxp-${i}`} sx={de.sx} sy={de.sy} progress={progress} />;
                if (de.type === 'lantern')
                  return <LanternGlow key={`fxl-${i}`} sx={de.sx} sy={de.sy} isNight={isNight} progress={progress} />;
                if (de.type === 'tree')
                  return <TreeRustle key={`fxt-${i}`} sx={de.sx} sy={de.sy} progress={progress} />;
                if (de.type === 'magic_lantern')
                  return <MagicLanternParticles key={`fxm-${i}`} sx={de.sx} sy={de.sy} progress={progress} />;
                if (de.type === 'wishing_well')
                  return <WishingWellSparkle key={`fxw-${i}`} sx={de.sx} sy={de.sy} progress={progress} />;
                return null;
              })}

              {/* ─── Garden pet (cat) ─── */}
              {streak >= 3 && (
                <GardenPet
                  canvasW={canvasW}
                  canvasH={canvasH}
                  groundY={canvasH * 0.55}
                  progress={progress}
                />
              )}

              {/* ─── Additional pets (purchased) ─── */}
              {activePets && activePets.length > 0 && (
                <GardenPets
                  activePets={activePets}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  groundY={canvasH * 0.55}
                  progress={progress}
                />
              )}

              {/* ─── Seasonal particles (blossoms, leaves, snow) ─── */}
              {seasonTheme.particleCount > 0 && (
                <SeasonalParticles
                  canvasW={canvasW}
                  canvasH={canvasH}
                  season={season}
                  count={seasonTheme.particleCount}
                  color={seasonTheme.particleColor}
                  progress={progress}
                />
              )}

              {/* ─── Season ambient overlay ─── */}
              {seasonTheme.ambientOverlay && (
                <Rect x={0} y={0} width={canvasW} height={canvasH} color={seasonTheme.ambientOverlay} />
              )}
            </Canvas>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootView: { flex: 1 },
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: SEASONAL_THEMES[getCurrentSeason()].groundColor,
  },
});
