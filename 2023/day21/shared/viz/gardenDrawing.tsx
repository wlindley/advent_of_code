import { type FiniteDistanceMap, type GardenMap, type GardenTraceFrame, UNREACHABLE_DISTANCE } from '../index';

export interface GardenCanvasLayout {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
}

export const GARDEN_COLORS = {
  rock: '#334155',
  unvisited: '#0f172a',
  exploredOpposite: '#1e293b',
  reachable: '#10b981',
  wavefront: '#f59e0b',
  start: '#38bdf8',
  gridLine: '#1e293b',
} as const;

export function computeCanvasLayout(map: GardenMap, maxDimension = 540): GardenCanvasLayout {
  const maxSpan = Math.max(map.width, map.height);
  const cellSize = Math.max(3, Math.min(36, Math.floor(maxDimension / maxSpan)));
  return {
    width: map.width * cellSize,
    height: map.height * cellSize,
    cellSize,
  };
}

function resolveCellColor(
  map: GardenMap,
  distMap: FiniteDistanceMap,
  frame: GardenTraceFrame,
  row: number,
  col: number,
  isolated: boolean,
): string {
  if (map.isRock(row, col)) return GARDEN_COLORS.rock;
  if (isolated) return GARDEN_COLORS.unvisited;
  const dist = distMap.distanceAt(row, col);
  if (dist === UNREACHABLE_DISTANCE || dist > frame.step) return GARDEN_COLORS.unvisited;
  if (dist === frame.step) return GARDEN_COLORS.wavefront;
  return (dist & 1) === (frame.step & 1) ? GARDEN_COLORS.reachable : GARDEN_COLORS.exploredOpposite;
}

export function drawGardenFrame(
  ctx: CanvasRenderingContext2D,
  map: GardenMap,
  distMap: FiniteDistanceMap,
  frame: GardenTraceFrame,
  layout: GardenCanvasLayout,
): void {
  const { cellSize, width, height } = layout;
  const isolated = frame.step > 0 && frame.reachableCount === 0;
  ctx.clearRect(0, 0, width, height);
  const gap = cellSize >= 8 ? 1 : 0;

  for (let row = 0; row < map.height; row += 1) {
    for (let col = 0; col < map.width; col += 1) {
      ctx.fillStyle = resolveCellColor(map, distMap, frame, row, col, isolated);
      ctx.fillRect(col * cellSize, row * cellSize, cellSize - gap, cellSize - gap);
    }
  }

  const sx = map.startCol * cellSize + (cellSize - gap) / 2;
  const sy = map.startRow * cellSize + (cellSize - gap) / 2;
  const radius = Math.max(2, (cellSize - gap) * 0.34);
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fillStyle = GARDEN_COLORS.start;
  ctx.fill();
}
