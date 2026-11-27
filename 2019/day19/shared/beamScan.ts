import { BeamGrid, type RowSpan } from './beamGrid';
import type { BeamOracle } from './beamProbe';

/** Per-row scan snapshot recorded while sweeping a `gridSize x gridSize` sector. */
export interface BeamScanStep {
  readonly y: number;
  readonly span: RowSpan | null;
  readonly affectedSoFar: number;
  readonly probeCount: number;
}

/** Result of scanning the `gridSize x gridSize` tractor beam area. */
export interface BeamScanResult {
  readonly grid: BeamGrid;
  readonly steps: readonly BeamScanStep[];
  readonly probeCount: number;
}

class CountingBeamOracle implements BeamOracle {
  private readonly inner: BeamOracle;
  count = 0;

  constructor(inner: BeamOracle) {
    this.inner = inner;
  }

  probe(x: number, y: number): boolean {
    this.count += 1;
    return this.inner.probe(x, y);
  }
}

function rowSearchLimit(y: number, gridSize: number, lastY: number, prevRight: number): number {
  if (lastY === 0 || prevRight >= gridSize - 1) {
    return gridSize - 1;
  }
  return Math.min(gridSize - 1, Math.ceil(((prevRight + 1) * y) / lastY));
}

function findRowLeft(oracle: BeamOracle, y: number, prevLeft: number, limit: number): number {
  for (let x = prevLeft; x <= limit; x += 1) {
    if (oracle.probe(x, y)) {
      return x;
    }
  }
  return -1;
}

function findRowRight(oracle: BeamOracle, y: number, startRight: number, gridSize: number): number {
  let right = startRight;
  while (right + 1 < gridSize && oracle.probe(right + 1, y)) {
    right += 1;
  }
  return right;
}

/**
 * Scans a `gridSize x gridSize` tractor beam area row-by-row using monotonic left/right edge
 * tracking and an exact cone upper bound for empty rows (`prevLeft`/`prevRight` preserved).
 */
export function scanBeamGrid(oracle: BeamOracle, gridSize: number): BeamScanResult {
  if (!Number.isInteger(gridSize) || gridSize < 1) {
    throw new RangeError(`gridSize must be a positive integer, got ${gridSize}`);
  }
  const counter = new CountingBeamOracle(oracle);
  const rowSpans: (RowSpan | null)[] = [];
  const steps: BeamScanStep[] = [];
  let prevLeft = 0;
  let prevRight = 0;
  let lastY = 0;
  let affectedSoFar = 0;

  for (let y = 0; y < gridSize; y += 1) {
    const limit = rowSearchLimit(y, gridSize, lastY, prevRight);
    const left = findRowLeft(counter, y, prevLeft, limit);
    let span: RowSpan | null = null;
    if (left !== -1) {
      const right = findRowRight(counter, y, Math.max(left, prevRight), gridSize);
      span = Object.freeze({ y, left, right });
      prevLeft = left;
      prevRight = right;
      lastY = y;
      affectedSoFar += right - left + 1;
    }
    rowSpans.push(span);
    steps.push(Object.freeze({ y, span, affectedSoFar, probeCount: counter.count }));
  }

  return Object.freeze({ grid: new BeamGrid(rowSpans), steps: Object.freeze(steps), probeCount: counter.count });
}
