import { TILE_W, TILE_H, MAX_GRID_SIZE, GridPosition } from './gardenTypes';

// ── Isometric projection ──

/** Grid coords → screen pixel coords (center of tile) */
export function toScreen(gx: number, gy: number, offsetX = 0, offsetY = 0) {
  const sx = (gx - gy) * (TILE_W / 2) + offsetX;
  const sy = (gx + gy) * (TILE_H / 2) + offsetY;
  return { sx, sy };
}

/** Screen coords → nearest grid cell */
export function toGrid(screenX: number, screenY: number, offsetX = 0, offsetY = 0): GridPosition {
  const sx = screenX - offsetX;
  const sy = screenY - offsetY;
  const gxf = (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2;
  const gyf = (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2;
  return { gx: Math.round(gxf), gy: Math.round(gyf) };
}

/** Check if grid coords are within active bounds */
export function inBounds(gx: number, gy: number, gridSize: number = MAX_GRID_SIZE): boolean {
  return gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize;
}

/** Check if a cell is in the "preview ring" (next expansion) */
export function isPreviewTile(gx: number, gy: number, activeSize: number): boolean {
  const previewSize = Math.min(activeSize + 1, MAX_GRID_SIZE);
  return (
    gx >= 0 && gx < previewSize && gy >= 0 && gy < previewSize &&
    !(gx >= 0 && gx < activeSize && gy >= 0 && gy < activeSize)
  );
}

/** Get the 4 corner points of an isometric diamond tile */
export function tileCorners(gx: number, gy: number, offsetX: number, offsetY: number) {
  const { sx, sy } = toScreen(gx, gy, offsetX, offsetY);
  return {
    top:    { x: sx,              y: sy - TILE_H / 2 },
    right:  { x: sx + TILE_W / 2, y: sy },
    bottom: { x: sx,              y: sy + TILE_H / 2 },
    left:   { x: sx - TILE_W / 2, y: sy },
  };
}

/** Canvas size needed for the full isometric grid */
export function getCanvasSize(gridSize: number = MAX_GRID_SIZE) {
  const width  = gridSize * TILE_W + TILE_W;
  const height = gridSize * TILE_H + TILE_H + 140; // extra for tall plants + sky
  return { width, height };
}

/** Get center offset so the grid is centered in the canvas */
export function getCenterOffset(canvasWidth: number, canvasHeight?: number, gridSize: number = MAX_GRID_SIZE) {
  const gridIsoH = gridSize * TILE_H + TILE_H;
  const plantExtraH = 80;

  let offsetY: number;
  if (canvasHeight && canvasHeight > gridIsoH + plantExtraH) {
    // Center the grid vertically, leave space above for sky/plants
    offsetY = (canvasHeight - gridIsoH) / 2 + 10;
  } else {
    offsetY = TILE_H * 2 + 70;
  }

  return {
    offsetX: canvasWidth / 2,
    offsetY,
  };
}

// ── Color helpers ──

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

export function blendColors(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

// ── Sorting for isometric draw order (painter's algorithm) ──

export function isoSortKey(gx: number, gy: number): number {
  return gx + gy;
}
