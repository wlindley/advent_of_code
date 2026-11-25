import type { PuzzleSolver } from '../../../../shared/core';
import { TachyonManifold } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 160;
/** Sentinel separating unvisited cells (0n) from visited cells with 1n timeline (log2(1n) === 0). */
export const EMPTY_DENSITY = -1;

export interface QuantumTimelineFrame {
  readonly row: number;
  readonly activeCols: number;
  readonly rowSplits: number;
  readonly totalTimelines: bigint;
  readonly exitedTimelines: bigint;
  readonly peakCellTimelines: bigint;
}

export interface QuantumSimulation {
  readonly totalTimelines: bigint;
  readonly exitedEarly: bigint;
  readonly maxLogDensity: number;
  readonly cellLogDensity: Float32Array;
  readonly frames: readonly QuantumTimelineFrame[];
}

/** Approximate log2(n) for arbitrarily large positive BigInts using the top 53 bits. */
export function bigIntLog2(n: bigint): number {
  if (n <= 0n) throw new RangeError(`bigIntLog2 requires a positive bigint, got ${n}`);
  const bits = n.toString(2);
  const topLen = Math.min(bits.length, 53);
  return Math.log2(Number.parseInt(bits.slice(0, topLen), 2)) + (bits.length - topLen);
}

export function simulateQuantum(manifold: TachyonManifold): QuantumSimulation {
  const { rows, cols, startRow, startCol } = manifold;
  const cellLogDensity = new Float32Array(rows * cols).fill(EMPTY_DENSITY);
  let maxLogDensity = 0, exited = 0n;
  const recordDensity = (idx: number, ways: bigint) => {
    const ld = bigIntLog2(ways);
    cellLogDensity[idx] = ld;
    if (ld > maxLogDensity) maxLogDensity = ld;
  };
  let current = new Array<bigint>(cols).fill(0n), next = new Array<bigint>(cols).fill(0n);
  current[startCol] = 1n;
  recordDensity(startRow * cols + startCol, 1n);
  const frames: QuantumTimelineFrame[] = [
    { row: startRow, activeCols: 1, rowSplits: 0, totalTimelines: 1n, exitedTimelines: 0n, peakCellTimelines: 1n },
  ];
  const emit = (col: number, ways: bigint) => {
    if (col >= 0 && col < cols) next[col] = next[col]! + ways;
    else exited += ways;
  };

  for (let r = startRow + 1; r < rows; r += 1) {
    next.fill(0n);
    let rowSplits = 0;
    const rowOffset = r * cols;
    for (let c = 0; c < cols; c += 1) {
      const ways = current[c]!;
      if (ways === 0n) continue;
      if (manifold.isSplitter(r, c)) {
        rowSplits += 1;
        recordDensity(rowOffset + c, ways);
        emit(c - 1, ways);
        emit(c + 1, ways);
      } else next[c] = next[c]! + ways;
    }
    let activeCols = 0, activeTimelines = 0n, peakCellTimelines = 0n;
    for (let c = 0; c < cols; c += 1) {
      const ways = next[c]!;
      if (ways === 0n) continue;
      activeCols += 1;
      activeTimelines += ways;
      if (ways > peakCellTimelines) peakCellTimelines = ways;
      if (!manifold.isSplitter(r, c)) recordDensity(rowOffset + c, ways);
    }
    frames.push({ row: r, activeCols, rowSplits, totalTimelines: exited + activeTimelines, exitedTimelines: exited, peakCellTimelines });
    [current, next] = [next, current];
  }
  return { totalTimelines: frames[frames.length - 1]!.totalTimelines, exitedEarly: exited, maxLogDensity, cellLogDensity, frames };
}

export function downsampleFrames<T>(frames: readonly T[], maxSteps: number): readonly T[] {
  if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
  if (frames.length <= maxSteps) return frames;
  if (maxSteps === 1) return [frames[frames.length - 1]!];
  const n = frames.length;
  return Array.from({ length: maxSteps }, (_, i) => frames[Math.round((i * (n - 1)) / (maxSteps - 1))]!);
}

export const solver: PuzzleSolver<TachyonManifold, bigint, QuantumTimelineFrame> = {
  parse: (raw) => TachyonManifold.parse(raw),
  solve: (manifold) => simulateQuantum(manifold).totalTimelines,
  trace: (manifold, options) => downsampleFrames(simulateQuantum(manifold).frames, options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS),
};
