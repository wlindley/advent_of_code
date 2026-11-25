import type { PuzzleSolver } from '../../../../shared/core';
import { TachyonManifold } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 160;
export const CellState = { Empty: 0, Beam: 1, UnreachedSplitter: 2, HitSplitter: 3 } as const;
export type CellStateValue = (typeof CellState)[keyof typeof CellState];

export interface BeamCascadeFrame {
  readonly row: number;
  readonly activeBeams: number;
  readonly rowSplits: number;
  readonly cumulativeSplits: number;
}

export interface BeamSimulation {
  readonly totalSplits: number;
  readonly activeAtExit: number;
  readonly cellStates: Uint8Array;
  readonly frames: readonly BeamCascadeFrame[];
}

export function simulateBeams(manifold: TachyonManifold): BeamSimulation {
  const { rows, cols, startRow, startCol } = manifold;
  const cellStates = new Uint8Array(rows * cols);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (manifold.isSplitter(r, c)) cellStates[r * cols + c] = CellState.UnreachedSplitter;
    }
  }
  cellStates[startRow * cols + startCol] = CellState.Beam;

  let current = new Uint8Array(cols);
  let next = new Uint8Array(cols);
  current[startCol] = 1;
  let totalSplits = 0;
  const frames: BeamCascadeFrame[] = [{ row: startRow, activeBeams: 1, rowSplits: 0, cumulativeSplits: 0 }];

  const emitSide = (r: number, col: number) => {
    next[col] = 1;
    if (!manifold.isSplitter(r, col)) cellStates[r * cols + col] = CellState.Beam;
  };

  for (let r = startRow + 1; r < rows; r += 1) {
    next.fill(0);
    let rowSplits = 0;
    for (let c = 0; c < cols; c += 1) {
      if (current[c] !== 1) continue;
      if (manifold.isSplitter(r, c)) {
        rowSplits += 1;
        cellStates[r * cols + c] = CellState.HitSplitter;
        if (c > 0) emitSide(r, c - 1);
        if (c + 1 < cols) emitSide(r, c + 1);
      } else {
        next[c] = 1;
        cellStates[r * cols + c] = CellState.Beam;
      }
    }
    totalSplits += rowSplits;
    let activeBeams = 0;
    for (let c = 0; c < cols; c += 1) activeBeams += next[c]!;
    frames.push({ row: r, activeBeams, rowSplits, cumulativeSplits: totalSplits });
    [current, next] = [next, current];
  }

  return { totalSplits, activeAtExit: frames[frames.length - 1]!.activeBeams, cellStates, frames };
}

export function downsampleFrames<T>(frames: readonly T[], maxSteps: number): readonly T[] {
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
  }
  if (frames.length <= maxSteps) return frames;
  if (maxSteps === 1) return [frames[frames.length - 1]!];
  const n = frames.length;
  return Array.from({ length: maxSteps }, (_, i) => frames[Math.round((i * (n - 1)) / (maxSteps - 1))]!);
}

export const solver: PuzzleSolver<TachyonManifold, number, BeamCascadeFrame> = {
  parse: (raw) => TachyonManifold.parse(raw),
  solve: (manifold) => simulateBeams(manifold).totalSplits,
  trace: (manifold, options) => downsampleFrames(simulateBeams(manifold).frames, options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS),
};
