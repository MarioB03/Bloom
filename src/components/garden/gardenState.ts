import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckinEntry, EmotionId, IntensityLevel } from '@/types/checkin';
import { formatDate } from '@/utils/date';
import {
  GardenLayout,
  PlantPlacement,
  DecorationPlacement,
  GridPosition,
  DecorationType,
  InteractionMode,
  WaterEffect,
  getActiveGridSize,
} from './gardenTypes';
import { inBounds } from './gardenUtils';

const STORAGE_KEY = '@bloom_garden_layout';
const WATER_EFFECT_DURATION = 3500; // ms — long enough to enjoy the animation

// ── Auto-place plants on the grid ──

function autoPlacePlants(checkins: CheckinEntry[], currentStreak: number): PlantPlacement[] {
  if (currentStreak === 0) return [];

  const gridSize = getActiveGridSize(currentStreak);
  const uniqueDates = [...new Set(checkins.map((c) => c.date))].sort();
  const streakDates = new Set(uniqueDates.slice(-currentStreak));

  const streakCheckins = checkins
    .filter((c) => streakDates.has(c.date))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.createdAt.seconds - b.createdAt.seconds;
    });

  const maxSlots = gridSize * gridSize;
  const plants: PlantPlacement[] = [];
  const occupied = new Set<string>();

  const center = Math.floor(gridSize / 2);
  const spiralPositions = generateSpiral(center, center, gridSize);

  for (let i = 0; i < Math.min(streakCheckins.length, maxSlots); i++) {
    const c = streakCheckins[i];
    const pos = spiralPositions[i];
    if (!pos) break;

    const key = `${pos.gx},${pos.gy}`;
    occupied.add(key);

    const totalPlants = streakCheckins.length;
    const age = totalPlants - i;

    plants.push({
      gx: pos.gx,
      gy: pos.gy,
      emotion: c.emotion,
      intensity: c.emotionIntensity,
      date: c.date,
      wateredToday: false,
      growthStage: Math.min(5, age),
    });
  }

  return plants;
}

/** Generate positions spiraling outward from center */
function generateSpiral(cx: number, cy: number, size: number): GridPosition[] {
  const positions: GridPosition[] = [{ gx: cx, gy: cy }];
  const visited = new Set<string>();
  visited.add(`${cx},${cy}`);

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: -1 },
  ];

  let x = cx, y = cy;
  let steps = 1;
  let dirIdx = 0;

  while (positions.length < size * size) {
    for (let turn = 0; turn < 2; turn++) {
      const dir = dirs[dirIdx % 4];
      for (let s = 0; s < steps; s++) {
        x += dir.dx;
        y += dir.dy;
        if (inBounds(x, y, size)) {
          const key = `${x},${y}`;
          if (!visited.has(key)) {
            visited.add(key);
            positions.push({ gx: x, gy: y });
          }
        }
      }
      dirIdx++;
    }
    steps++;
  }

  return positions;
}

// ── Hook ──

export interface GardenStateResult {
  layout: GardenLayout;
  mode: InteractionMode;
  selectedPlant: PlantPlacement | null;
  loading: boolean;
  waterEffects: WaterEffect[];
  setMode: (mode: InteractionMode) => void;
  selectPlant: (plant: PlantPlacement | null) => void;
  movePlant: (from: GridPosition, to: GridPosition) => void;
  addDecoration: (gx: number, gy: number, type: DecorationType) => void;
  removeDecoration: (gx: number, gy: number) => void;
  waterPlant: (gx: number, gy: number) => void;
  refreshFromCheckins: (checkins: CheckinEntry[], streak: number) => void;
}

export function useGardenState(): GardenStateResult {
  const [layout, setLayout] = useState<GardenLayout>({
    plants: [],
    decorations: [],
    pathTiles: [],
  });
  const [mode, setMode] = useState<InteractionMode>('view');
  const [selectedPlant, selectPlant] = useState<PlantPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [waterEffects, setWaterEffects] = useState<WaterEffect[]>([]);
  const waterTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup water effect timers
  useEffect(() => {
    return () => {
      waterTimers.current.forEach(clearTimeout);
    };
  }, []);

  // Load saved decorations from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const saved = JSON.parse(stored) as Partial<GardenLayout>;
          setLayout((prev) => ({
            ...prev,
            decorations: saved.decorations || [],
            pathTiles: saved.pathTiles || [],
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Persist decorations
  const persist = useCallback((updated: GardenLayout) => {
    const toSave = {
      decorations: updated.decorations,
      pathTiles: updated.pathTiles,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, []);

  const refreshFromCheckins = useCallback(
    (checkins: CheckinEntry[], streak: number) => {
      const plants = autoPlacePlants(checkins, streak);
      setLayout((prev) => {
        // Restore watered state from any previous watering this session
        const wateredKeys = new Set(
          prev.plants.filter((p) => p.wateredToday).map((p) => `${p.gx},${p.gy}`)
        );
        const mergedPlants = plants.map((p) => {
          if (wateredKeys.has(`${p.gx},${p.gy}`)) {
            return { ...p, wateredToday: true, growthStage: Math.min(5, p.growthStage + 1) };
          }
          return p;
        });
        return { ...prev, plants: mergedPlants };
      });
    },
    []
  );

  const movePlant = useCallback((from: GridPosition, to: GridPosition) => {
    setLayout((prev) => {
      const plantIdx = prev.plants.findIndex(
        (p) => p.gx === from.gx && p.gy === from.gy
      );
      if (plantIdx === -1) return prev;
      const occupied =
        prev.plants.some((p) => p.gx === to.gx && p.gy === to.gy) ||
        prev.decorations.some((d) => d.gx === to.gx && d.gy === to.gy);
      if (occupied) return prev;

      const updated = { ...prev, plants: [...prev.plants] };
      updated.plants[plantIdx] = { ...updated.plants[plantIdx], gx: to.gx, gy: to.gy };
      return updated;
    });
  }, []);

  const addDecoration = useCallback(
    (gx: number, gy: number, type: DecorationType) => {
      setLayout((prev) => {
        const occupied =
          prev.plants.some((p) => p.gx === gx && p.gy === gy) ||
          prev.decorations.some((d) => d.gx === gx && d.gy === gy);
        if (occupied) return prev;

        const updated = {
          ...prev,
          decorations: [...prev.decorations, { gx, gy, type }],
        };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeDecoration = useCallback(
    (gx: number, gy: number) => {
      setLayout((prev) => {
        const updated = {
          ...prev,
          decorations: prev.decorations.filter(
            (d) => !(d.gx === gx && d.gy === gy)
          ),
        };
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const waterPlant = useCallback((gx: number, gy: number) => {
    setLayout((prev) => {
      const idx = prev.plants.findIndex((p) => p.gx === gx && p.gy === gy);
      if (idx === -1) return prev;
      const plant = prev.plants[idx];
      if (plant.wateredToday) return prev;

      const updated = { ...prev, plants: [...prev.plants] };
      updated.plants[idx] = {
        ...plant,
        wateredToday: true,
        // Watering boosts growth by 1 stage!
        growthStage: Math.min(5, plant.growthStage + 1),
      };
      return updated;
    });

    // Add water effect animation
    const effect: WaterEffect = { gx, gy, startTime: Date.now() };
    setWaterEffects((prev) => [...prev, effect]);

    // Remove effect after duration
    const timer = setTimeout(() => {
      setWaterEffects((prev) => prev.filter((e) => e !== effect));
    }, WATER_EFFECT_DURATION);
    waterTimers.current.push(timer);
  }, []);

  return {
    layout,
    mode,
    selectedPlant,
    loading,
    waterEffects,
    setMode,
    selectPlant,
    movePlant,
    addDecoration,
    removeDecoration,
    waterPlant,
    refreshFromCheckins,
  };
}
