import {
  computeScreenBounds,
  type ArcadeTraceFrame,
  type GridPoint,
  type JoystickTilt,
  type ScreenBounds,
} from './arcadeModels';

export const TILE_SIZE = 16;
const TILE_INSET = 1;
const TILE_SPAN = TILE_SIZE - 2 * TILE_INSET;
const HALF_TILE = TILE_SIZE / 2;

export const RAINBOW_BAND_COLORS: readonly [string, string, string, string, string] = Object.freeze([
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#38bdf8',
]);

/** Precomputed batched SVG layers and HUD summary for a single arcade trace frame. */
export interface ArcadeSvgLayout {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly wallPath: string;
  readonly blockBandPaths: readonly [string, string, string, string, string];
  readonly paddlePath: string;
  readonly ballCenter: GridPoint | null;
  readonly ballTrailPoints: string;
  readonly wallCount: number;
  readonly blockCount: number;
  readonly paddleCount: number;
  readonly ballCount: number;
  readonly bounds: ScreenBounds;
  readonly tiltLabel: string;
  readonly statusSummary: string;
}

export function formatTiltLabel(tilt: JoystickTilt | null): string {
  if (tilt === -1) return 'LEFT (-1)';
  if (tilt === 1) return 'RIGHT (+1)';
  if (tilt === 0) return 'NEUTRAL (0)';
  return 'NONE';
}

function cellRectPath(x: number, y: number): string {
  return `M${x * TILE_SIZE + TILE_INSET} ${y * TILE_SIZE + TILE_INSET}h${TILE_SPAN}v${TILE_SPAN}h-${TILE_SPAN}z`;
}

function paddleRectPath(x: number, y: number): string {
  return `M${x * TILE_SIZE + TILE_INSET} ${y * TILE_SIZE + 4}h${TILE_SPAN}v8h-${TILE_SPAN}z`;
}

function formatStatusSummary(frame: ArcadeTraceFrame, blockCount: number, tiltLabel: string): string {
  if (frame.phase === 'draw') {
    if (frame.totalSteps === 0) return 'No draw instructions emitted';
    if (frame.stepIndex === 0) return 'Initial blank screen';
    return `Drew ${frame.stepIndex} / ${frame.totalSteps} outputs (${blockCount} blocks)`;
  }
  if (frame.inputTurn === 0) {
    return `Cabinet initialized (${blockCount} blocks)`;
  }
  return `Turn ${frame.inputTurn} / ${frame.totalInputTurns} · Tilt ${tiltLabel} · Score ${frame.score}`;
}

function collectTileLayers(frame: ArcadeTraceFrame) {
  let wallPath = '', paddlePath = '';
  const bands: [string, string, string, string, string] = ['', '', '', '', ''];
  let wallCount = 0, blockCount = 0, paddleCount = 0, ballCount = 0;
  let ballCenter: GridPoint | null = null;

  for (const tile of frame.tiles.values()) {
    if (tile.id === 1) {
      wallPath += cellRectPath(tile.x, tile.y);
      wallCount += 1;
    } else if (tile.id === 2) {
      const band = tile.y % 5;
      bands[band] = bands[band]! + cellRectPath(tile.x, tile.y);
      blockCount += 1;
    } else if (tile.id === 3) {
      paddlePath += paddleRectPath(tile.x, tile.y);
      paddleCount += 1;
    } else if (tile.id === 4) {
      ballCenter = Object.freeze({ x: tile.x * TILE_SIZE + HALF_TILE, y: tile.y * TILE_SIZE + HALF_TILE });
      ballCount += 1;
    }
  }

  return {
    wallPath,
    blockBandPaths: Object.freeze(bands) as readonly [string, string, string, string, string],
    paddlePath,
    ballCenter,
    wallCount,
    blockCount,
    paddleCount,
    ballCount,
  };
}

/** Builds batched SVG paths, ball trail, and HUD metrics for an arcade trace frame. */
export function buildArcadeSvgLayout(frame: ArcadeTraceFrame): ArcadeSvgLayout {
  const layers = collectTileLayers(frame);
  const bounds = computeScreenBounds(frame.tiles);
  const width = (bounds.width + 2) * TILE_SIZE;
  const height = (bounds.height + 2) * TILE_SIZE;
  const viewBox = `${(bounds.minX - 1) * TILE_SIZE} ${(bounds.minY - 1) * TILE_SIZE} ${width} ${height}`;
  const ballTrailPoints = frame.ballTrail
    .map((pt) => `${pt.x * TILE_SIZE + HALF_TILE},${pt.y * TILE_SIZE + HALF_TILE}`)
    .join(' ');
  const tiltLabel = formatTiltLabel(frame.lastTilt);

  return Object.freeze({
    viewBox,
    width,
    height,
    ...layers,
    ballTrailPoints,
    bounds,
    tiltLabel,
    statusSummary: formatStatusSummary(frame, layers.blockCount, tiltLabel),
  });
}
