import type { GridPoint, VaultMap } from './vaultMap';
import type { VaultTraceFrame } from './vaultTrace';

/** Logical CSS-pixel canvas geometry for rendering a Day 18 vault grid. */
export interface VaultRenderMetrics {
  readonly cellSize: number;
  readonly pad: number;
  readonly width: number;
  readonly height: number;
}

/** UI badge state for a single key in alphabetical order. */
export interface KeyRingBadge {
  readonly letter: string;
  readonly collected: boolean;
}

const TARGET_CANVAS_WIDTH = 720;
const TARGET_CANVAS_HEIGHT = 520;
const MIN_CELL_SIZE = 6;
const MAX_CELL_SIZE = 32;
const CANVAS_PAD = 8;

/** Computes bounded logical canvas dimensions for a `rows x cols` vault map. */
export function computeVaultRenderMetrics(rows: number, cols: number): VaultRenderMetrics {
  if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
    throw new RangeError(`Vault dimensions must be positive integers, got ${rows}x${cols}`);
  }
  const rawCell = Math.floor(Math.min(TARGET_CANVAS_WIDTH / cols, TARGET_CANVAS_HEIGHT / rows));
  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, rawCell));
  return Object.freeze({
    cellSize,
    pad: CANVAS_PAD,
    width: cols * cellSize + CANVAS_PAD * 2,
    height: rows * cellSize + CANVAS_PAD * 2,
  });
}

/** Builds alphabetical key-collection status badges from `collectedMask`. */
export function buildKeyRingBadges(map: VaultMap, collectedMask: number): readonly KeyRingBadge[] {
  return Object.freeze(
    map.keys.map((key) =>
      Object.freeze({
        letter: key.letter,
        collected: (collectedMask & key.bit) !== 0,
      }),
    ),
  );
}

/** Derives current robot positions from shared trails and per-frame trail lengths. */
export function getRobotPositions(frame: VaultTraceFrame): readonly GridPoint[] {
  return Object.freeze(
    frame.trailLengths.map((len, r) => frame.robotTrails[r]![len - 1]!),
  );
}

/** Formats concise telemetry status for the Day 18 visualizer header. */
export function formatVaultStatus(frame: VaultTraceFrame): string {
  const collectedCount = frame.map.keys.filter((k) => (frame.collectedMask & k.bit) !== 0).length;
  const actor = frame.activeRobotIndex < 0 ? 'Ready' : `Robot ${frame.activeRobotIndex + 1}`;
  return `${actor} · Step ${frame.stepIndex} / ${frame.totalSteps} · Keys ${collectedCount}/${frame.map.keys.length} · States ${frame.expandedStates}`;
}
