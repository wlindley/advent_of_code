import {
  ORIGIN,
  computeShipBounds,
  type DroidStatus,
  type GridPoint,
  type MoveCommand,
  type OxygenPolicy,
  type OxygenTraceFrame,
  type ShipBounds,
} from './oxygenModels';

export const CELL_SIZE = 16;
const CELL_INSET = 1;
const CELL_SPAN = CELL_SIZE - 2 * CELL_INSET;
const HALF_CELL = CELL_SIZE / 2;

const COMMAND_LABELS: Readonly<Record<MoveCommand, string>> = Object.freeze({
  1: 'NORTH (1)',
  2: 'SOUTH (2)',
  3: 'WEST (3)',
  4: 'EAST (4)',
});

const STATUS_LABELS: Readonly<Record<DroidStatus, string>> = Object.freeze({
  0: 'Wall',
  1: 'Open',
  2: 'Oxygen!',
});

/** Precomputed batched SVG geometry and HUD summary for a single Day 15 trace frame. */
export interface OxygenSvgLayout {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly wallPath: string;
  readonly openPath: string;
  readonly wavePath: string;
  readonly frontierPath: string;
  readonly shortestPathPoints: string;
  readonly originCenter: GridPoint;
  readonly droidCenter: GridPoint | null;
  readonly oxygenCenter: GridPoint | null;
  readonly openCount: number;
  readonly wallCount: number;
  readonly reachedCount: number;
  readonly bounds: ShipBounds;
  readonly commandLabel: string;
  readonly statusSummary: string;
}

export function formatCommandLabel(command: MoveCommand | null): string {
  return command !== null ? COMMAND_LABELS[command] : 'START';
}

function cellRectPath(x: number, y: number): string {
  return `M${x * CELL_SIZE + CELL_INSET} ${y * CELL_SIZE + CELL_INSET}h${CELL_SPAN}v${CELL_SPAN}h-${CELL_SPAN}z`;
}

function cellCenter(point: GridPoint): GridPoint {
  return Object.freeze({ x: point.x * CELL_SIZE + HALF_CELL, y: point.y * CELL_SIZE + HALF_CELL });
}

function collectMapLayers(frame: OxygenTraceFrame) {
  let wallPath = '';
  let openPath = '';
  let wallCount = 0;
  let openCount = 0;

  for (const tile of frame.tiles.values()) {
    const rect = cellRectPath(tile.x, tile.y);
    if (tile.kind === 'wall') {
      wallPath += rect;
      wallCount += 1;
    } else {
      openPath += rect;
      openCount += 1;
    }
  }
  return { wallPath, openPath, wallCount, openCount };
}

function collectWaveLayers(frame: OxygenTraceFrame) {
  let wavePath = '';
  let frontierPath = '';
  let reachedCount = 0;

  if (frame.distances !== null) {
    reachedCount = frame.distances.size;
    for (const [key, dist] of frame.distances.entries()) {
      const tile = frame.tiles.get(key)!;
      const rect = cellRectPath(tile.x, tile.y);
      if (dist === frame.frontierDistance) {
        frontierPath += rect;
      } else {
        wavePath += rect;
      }
    }
  }
  return { wavePath, frontierPath, reachedCount };
}

function formatStatusSummary(
  frame: OxygenTraceFrame,
  policy: OxygenPolicy,
  openCount: number,
  wallCount: number,
  reachedCount: number,
): string {
  if (frame.phase === 'solve') {
    return `${policy.waveLabel} · Step ${frame.frontierDistance} · Reached ${reachedCount} / ${openCount}`;
  }
  if (frame.lastCommand === null) {
    return `Initial droid at origin (0,0) · ${openCount} open · ${wallCount} walls`;
  }
  const tag = frame.isBacktrack ? ' [Backtrack]' : '';
  const outcome = STATUS_LABELS[frame.lastStatus!];
  return `Explore ${formatCommandLabel(frame.lastCommand)}${tag} -> ${outcome}`;
}

/** Builds batched SVG paths and HUD metrics for a Day 15 trace frame. */
export function buildOxygenSvgLayout(frame: OxygenTraceFrame, policy: OxygenPolicy): OxygenSvgLayout {
  const mapLayers = collectMapLayers(frame);
  const waveLayers = collectWaveLayers(frame);
  const bounds = computeShipBounds(frame.tiles);
  const width = (bounds.width + 2) * CELL_SIZE;
  const height = (bounds.height + 2) * CELL_SIZE;
  const viewBox = `${(bounds.minX - 1) * CELL_SIZE} ${(bounds.minY - 1) * CELL_SIZE} ${width} ${height}`;
  const shortestPathPoints = frame.shortestPath
    .map((pt) => `${pt.x * CELL_SIZE + HALF_CELL},${pt.y * CELL_SIZE + HALF_CELL}`)
    .join(' ');

  return Object.freeze({
    viewBox,
    width,
    height,
    ...mapLayers,
    ...waveLayers,
    shortestPathPoints,
    originCenter: cellCenter(ORIGIN),
    droidCenter: frame.phase === 'explore' ? cellCenter(frame.droid) : null,
    oxygenCenter: frame.oxygen !== null ? cellCenter(frame.oxygen) : null,
    bounds,
    commandLabel: formatCommandLabel(frame.lastCommand),
    statusSummary: formatStatusSummary(
      frame,
      policy,
      mapLayers.openCount,
      mapLayers.wallCount,
      waveLayers.reachedCount,
    ),
  });
}
