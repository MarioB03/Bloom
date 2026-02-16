import React, { useMemo } from 'react';
import {
  Group,
  Path,
  Circle,
  Rect,
  Skia,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { PetType } from './gardenTypes';

// ── Garden Pet: animated cat that wanders the garden ──

interface GardenPetProps {
  canvasW: number;
  canvasH: number;
  groundY: number; // Y coordinate of ground level
  progress: SharedValue<number>;
}

export function GardenPet({ canvasW, canvasH, groundY, progress }: GardenPetProps) {
  // Wander: slow figure-8 path across the garden
  const cx = useDerivedValue(() => {
    const t = progress.value * 0.4; // slow speed
    return canvasW * 0.25 + Math.sin(t * 1.1) * canvasW * 0.25;
  });

  const cy = useDerivedValue(() => {
    const t = progress.value * 0.4;
    return groundY + 10 + Math.sin(t * 2.2) * 12;
  });

  // Tail wag
  const tailAngle = useDerivedValue(() => {
    return Math.sin(progress.value * Math.PI * 8) * 0.4;
  });

  // Head bob
  const headBob = useDerivedValue(() => {
    return Math.sin(progress.value * Math.PI * 4) * 1.5;
  });

  // Facing direction (flips based on horizontal movement direction)
  const facingRight = useDerivedValue(() => {
    const t = progress.value * 0.4;
    return Math.cos(t * 1.1) > 0 ? 1 : -1;
  });

  // Body path (static shape)
  const bodyPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Body oval
    p.addOval({ x: -8, y: -5, width: 16, height: 10 });
    return p;
  }, []);

  // Ear paths
  const leftEar = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(-5, -8);
    p.lineTo(-8, -15);
    p.lineTo(-2, -10);
    p.close();
    return p;
  }, []);

  const rightEar = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(5, -8);
    p.lineTo(8, -15);
    p.lineTo(2, -10);
    p.close();
    return p;
  }, []);

  // Main transform
  const bodyTransform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
    { scaleX: facingRight.value },
  ]);

  // Head transform
  const headTransform = useDerivedValue(() => [
    { translateY: headBob.value - 7 },
  ]);

  // Tail transform
  const tailTransform = useDerivedValue(() => [
    { translateX: -9 },
    { translateY: -2 },
    { rotate: tailAngle.value },
  ]);

  return (
    <Group transform={bodyTransform}>
      {/* Shadow */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.addOval({ x: -7, y: 4, width: 14, height: 4 });
          return p;
        })()}
        color="rgba(0,0,0,0.06)"
      />

      {/* Tail */}
      <Group transform={tailTransform}>
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.moveTo(0, 0);
            p.cubicTo(-6, -8, -10, -6, -8, -12);
            return p;
          })()}
          color="#8B7355"
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
        />
      </Group>

      {/* Body */}
      <Path path={bodyPath} color="#A89070" />
      {/* Belly lighter patch */}
      <Path
        path={(() => {
          const p = Skia.Path.Make();
          p.addOval({ x: -4, y: -2, width: 8, height: 6 });
          return p;
        })()}
        color="#C4B8A0"
      />

      {/* Legs */}
      {[{ x: -5, y: 3 }, { x: -2, y: 4 }, { x: 3, y: 4 }, { x: 6, y: 3 }].map((leg, i) => (
        <Path
          key={`leg-${i}`}
          path={(() => {
            const p = Skia.Path.Make();
            p.moveTo(leg.x, leg.y);
            p.lineTo(leg.x, leg.y + 5);
            return p;
          })()}
          color="#8B7355"
          style="stroke"
          strokeWidth={1.8}
          strokeCap="round"
        />
      ))}

      {/* Head */}
      <Group transform={headTransform}>
        {/* Head circle */}
        <Circle cx={3} cy={0} r={6} color="#A89070" />
        {/* Ears */}
        <Path path={leftEar} color="#A89070" />
        <Path path={rightEar} color="#A89070" />
        {/* Inner ears */}
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.moveTo(-4.5, -8.5);
            p.lineTo(-6.5, -13);
            p.lineTo(-2.5, -10);
            p.close();
            return p;
          })()}
          color="#D4A0A0"
        />
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.moveTo(4.5, -8.5);
            p.lineTo(6.5, -13);
            p.lineTo(2.5, -10);
            p.close();
            return p;
          })()}
          color="#D4A0A0"
        />
        {/* Eyes */}
        <Circle cx={0.5} cy={-1} r={1.2} color="#3A3020" />
        <Circle cx={5.5} cy={-1} r={1.2} color="#3A3020" />
        {/* Eye shine */}
        <Circle cx={1} cy={-1.5} r={0.5} color="rgba(255,255,255,0.7)" />
        <Circle cx={6} cy={-1.5} r={0.5} color="rgba(255,255,255,0.7)" />
        {/* Nose */}
        <Circle cx={3} cy={1} r={0.8} color="#D4A0A0" />
        {/* Whiskers */}
        {[
          { x1: -2, y1: 0.5, x2: -7, y2: -0.5 },
          { x1: -2, y1: 1.5, x2: -7, y2: 2 },
          { x1: 8, y1: 0.5, x2: 13, y2: -0.5 },
          { x1: 8, y1: 1.5, x2: 13, y2: 2 },
        ].map((w, i) => (
          <Path
            key={`whisker-${i}`}
            path={(() => {
              const p = Skia.Path.Make();
              p.moveTo(w.x1, w.y1);
              p.lineTo(w.x2, w.y2);
              return p;
            })()}
            color="rgba(80,60,40,0.3)"
            style="stroke"
            strokeWidth={0.5}
          />
        ))}
      </Group>
    </Group>
  );
}

// ── Bunny Pet: hops around the garden ──

function BunnyPet({ canvasW, canvasH, groundY, progress }: GardenPetProps) {
  const cx = useDerivedValue(() => {
    const t = progress.value * 0.35;
    return canvasW * 0.6 + Math.sin(t * 1.5) * canvasW * 0.2;
  });
  const cy = useDerivedValue(() => {
    const t = progress.value * 0.35;
    const hop = Math.abs(Math.sin(t * 8)) * 8; // hopping motion
    return groundY + 15 + Math.sin(t * 1.8) * 10 - hop;
  });
  const facingRight = useDerivedValue(() => {
    const t = progress.value * 0.35;
    return Math.cos(t * 1.5) > 0 ? 1 : -1;
  });

  const bodyTransform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
    { scaleX: facingRight.value },
  ]);

  return (
    <Group transform={bodyTransform}>
      {/* Shadow */}
      <Path path={(() => { const p = Skia.Path.Make(); p.addOval({ x: -5, y: 3, width: 10, height: 3 }); return p; })()} color="rgba(0,0,0,0.05)" />
      {/* Body */}
      <Path path={(() => { const p = Skia.Path.Make(); p.addOval({ x: -6, y: -4, width: 12, height: 8 }); return p; })()} color="#E0D4C0" />
      {/* Head */}
      <Circle cx={5} cy={-5} r={4.5} color="#E8DCD0" />
      {/* Ears (long) */}
      <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(3, -8); p.cubicTo(2, -18, 4, -20, 5, -18); p.lineTo(5, -8); p.close(); return p; })()} color="#E8DCD0" />
      <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(6, -8); p.cubicTo(7, -17, 9, -19, 8, -17); p.lineTo(7, -8); p.close(); return p; })()} color="#E8DCD0" />
      {/* Inner ears */}
      <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(3.5, -9); p.cubicTo(3, -16, 4.5, -17, 4.5, -16); p.lineTo(4.5, -9); p.close(); return p; })()} color="#E0B0B0" />
      {/* Eyes */}
      <Circle cx={3.5} cy={-5.5} r={1} color="#3A3020" />
      <Circle cx={6.5} cy={-5.5} r={1} color="#3A3020" />
      {/* Nose */}
      <Circle cx={5} cy={-3.5} r={0.7} color="#E0B0B0" />
      {/* Tail (cotton puff) */}
      <Circle cx={-6} cy={-1} r={2.5} color="#F0E8E0" />
    </Group>
  );
}

// ── Bird Pet: flies between flowers ──

function BirdPet({ canvasW, canvasH, groundY, progress }: GardenPetProps) {
  const cx = useDerivedValue(() => {
    const t = progress.value * 0.6;
    return canvasW * 0.4 + Math.sin(t * 1.3) * canvasW * 0.3;
  });
  const cy = useDerivedValue(() => {
    const t = progress.value * 0.6;
    return groundY - 20 + Math.sin(t * 2.5) * 15;
  });
  const wingFlap = useDerivedValue(() => {
    return Math.sin(progress.value * 25) * 0.6;
  });
  const facingRight = useDerivedValue(() => {
    const t = progress.value * 0.6;
    return Math.cos(t * 1.3) > 0 ? 1 : -1;
  });

  const bodyTransform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
    { scaleX: facingRight.value },
  ]);

  const wingPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, 0);
    p.cubicTo(-3, -6, -8, -5, -7, 0);
    p.close();
    return p;
  }, []);

  const wingTransform = useDerivedValue(() => [
    { rotate: wingFlap.value },
  ]);

  return (
    <Group transform={bodyTransform}>
      {/* Body */}
      <Path path={(() => { const p = Skia.Path.Make(); p.addOval({ x: -4, y: -3, width: 8, height: 6 }); return p; })()} color="#6BA3D0" />
      {/* Wing */}
      <Group transform={wingTransform} origin={{ x: 0, y: 0 }}>
        <Path path={wingPath} color="#5090C0" />
      </Group>
      {/* Head */}
      <Circle cx={4} cy={-3} r={3} color="#6BA3D0" />
      {/* Eye */}
      <Circle cx={5} cy={-3.5} r={0.8} color="#2A2020" />
      <Circle cx={5.3} cy={-3.8} r={0.3} color="rgba(255,255,255,0.6)" />
      {/* Beak */}
      <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(7, -3); p.lineTo(10, -2.5); p.lineTo(7, -2); p.close(); return p; })()} color="#E8A040" />
      {/* Tail */}
      <Path path={(() => { const p = Skia.Path.Make(); p.moveTo(-4, -1); p.lineTo(-8, -3); p.lineTo(-7, 0); p.close(); return p; })()} color="#5090C0" />
    </Group>
  );
}

// ── Golden Butterfly Pet: sparkly slow flight ──

function GoldenButterflyPet({ canvasW, canvasH, groundY, progress }: GardenPetProps) {
  const cx = useDerivedValue(() => {
    const t = progress.value * 0.3;
    return canvasW * 0.5 + Math.sin(t * 1.7) * canvasW * 0.3;
  });
  const cy = useDerivedValue(() => {
    const t = progress.value * 0.3;
    return groundY - 10 + Math.sin(t * 2.3) * canvasH * 0.08;
  });
  const wingScale = useDerivedValue(() => {
    return 0.3 + Math.abs(Math.sin(progress.value * 20)) * 0.7;
  });
  const sparkleOpacity = useDerivedValue(() => {
    return 0.3 + Math.sin(progress.value * 15) * 0.3;
  });

  const wingPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Left wing
    p.moveTo(0, 0);
    p.cubicTo(-7, -7, -11, -4, -8, 2);
    p.cubicTo(-10, 6, -5, 7, 0, 0);
    // Right wing
    p.moveTo(0, 0);
    p.cubicTo(7, -7, 11, -4, 8, 2);
    p.cubicTo(10, 6, 5, 7, 0, 0);
    return p;
  }, []);

  const transform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
    { scaleX: wingScale.value },
  ]);

  return (
    <Group transform={transform}>
      <Path path={wingPath} color="rgba(240,200,60,0.75)" />
      {/* Body */}
      <Rect x={-0.7} y={-3} width={1.4} height={6} color="rgba(80,60,20,0.7)" />
      {/* Sparkle trail */}
      <Circle cx={-3} cy={-2} r={1} color="rgba(255,220,80,1)" opacity={sparkleOpacity} />
      <Circle cx={3} cy={-2} r={1} color="rgba(255,220,80,1)" opacity={sparkleOpacity} />
    </Group>
  );
}

// ── Hedgehog Pet: waddles slowly on the ground ──

function HedgehogPet({ canvasW, canvasH, groundY, progress }: GardenPetProps) {
  const cx = useDerivedValue(() => {
    const t = progress.value * 0.25; // very slow
    return canvasW * 0.3 + Math.sin(t * 0.9) * canvasW * 0.15;
  });
  const cy = useDerivedValue(() => {
    const t = progress.value * 0.25;
    return groundY + 20 + Math.sin(t * 1.6) * 6;
  });
  const waddle = useDerivedValue(() => {
    return Math.sin(progress.value * 12) * 0.08;
  });
  const facingRight = useDerivedValue(() => {
    const t = progress.value * 0.25;
    return Math.cos(t * 0.9) > 0 ? 1 : -1;
  });

  const bodyTransform = useDerivedValue(() => [
    { translateX: cx.value },
    { translateY: cy.value },
    { scaleX: facingRight.value },
    { rotate: waddle.value },
  ]);

  return (
    <Group transform={bodyTransform}>
      {/* Shadow */}
      <Path path={(() => { const p = Skia.Path.Make(); p.addOval({ x: -6, y: 2, width: 12, height: 3 }); return p; })()} color="rgba(0,0,0,0.05)" />
      {/* Spines (back) */}
      <Path path={(() => { const p = Skia.Path.Make(); p.addOval({ x: -7, y: -6, width: 12, height: 10 }); return p; })()} color="#8B6B40" />
      {/* Spine texture */}
      {[{ dx: -4, dy: -5 }, { dx: -2, dy: -6 }, { dx: 0, dy: -5.5 }, { dx: 2, dy: -5 }, { dx: -3, dy: -3 }, { dx: 1, dy: -3 }].map((sp, i) => (
        <Path
          key={`spine-${i}`}
          path={(() => { const p = Skia.Path.Make(); p.moveTo(sp.dx, sp.dy); p.lineTo(sp.dx - 1, sp.dy - 2.5); return p; })()}
          color="#6B5030"
          style="stroke"
          strokeWidth={1}
          strokeCap="round"
        />
      ))}
      {/* Face (lighter) */}
      <Path path={(() => { const p = Skia.Path.Make(); p.addOval({ x: 2, y: -4, width: 7, height: 6 }); return p; })()} color="#D8C8A8" />
      {/* Eye */}
      <Circle cx={6} cy={-2} r={0.9} color="#2A2020" />
      <Circle cx={6.3} cy={-2.3} r={0.3} color="rgba(255,255,255,0.6)" />
      {/* Nose */}
      <Circle cx={8} cy={-0.5} r={0.7} color="#3A3020" />
      {/* Legs (tiny) */}
      {[{ x: -3, y: 2 }, { x: 1, y: 2.5 }, { x: 4, y: 2 }].map((leg, i) => (
        <Path
          key={`hleg-${i}`}
          path={(() => { const p = Skia.Path.Make(); p.moveTo(leg.x, leg.y); p.lineTo(leg.x, leg.y + 3); return p; })()}
          color="#8B7355"
          style="stroke"
          strokeWidth={1.5}
          strokeCap="round"
        />
      ))}
    </Group>
  );
}

// ── GardenPets: renders all active purchased pets ──

interface GardenPetsProps {
  activePets: PetType[];
  canvasW: number;
  canvasH: number;
  groundY: number;
  progress: SharedValue<number>;
}

export function GardenPets({ activePets, canvasW, canvasH, groundY, progress }: GardenPetsProps) {
  return (
    <Group>
      {activePets.map((pet) => {
        const props = { canvasW, canvasH, groundY, progress };
        switch (pet) {
          case 'bunny':
            return <BunnyPet key="bunny" {...props} />;
          case 'bird':
            return <BirdPet key="bird" {...props} />;
          case 'golden_butterfly':
            return <GoldenButterflyPet key="golden_butterfly" {...props} />;
          case 'hedgehog':
            return <HedgehogPet key="hedgehog" {...props} />;
          default:
            return null;
        }
      })}
    </Group>
  );
}
