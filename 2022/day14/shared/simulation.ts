import { type CaveBoundaryPolicy, type CaveBounds } from './boundaryPolicy';
import { CavePoint, type CaveScan, SOURCE_X, SOURCE_Y } from './caveScan';

export const CELL_ROCK = -1;
export const CELL_AIR = 0;

/** Immutable sand-pouring simulation result with rock/sand cell states and escape path. */
export class ReservoirField {
  readonly bounds: CaveBounds;
  readonly escapePath: readonly CavePoint[];
  readonly #cells: Int32Array;
  readonly #settledIndices: Int32Array;

  constructor(
    bounds: CaveBounds,
    cells: Int32Array,
    settledIndices: Int32Array,
    escapePath: readonly CavePoint[],
  ) {
    if (cells.length !== bounds.cellCount) {
      throw new RangeError(`Expected ${bounds.cellCount} cells, got ${cells.length}`);
    }
    this.bounds = bounds;
    this.#cells = new Int32Array(cells);
    this.#settledIndices = new Int32Array(settledIndices);
    this.escapePath = Object.freeze([...escapePath]);
    Object.freeze(this);
  }

  get settledCount(): number {
    return this.#settledIndices.length;
  }

  get escaped(): boolean {
    return this.escapePath.length > 0;
  }

  cellAt(x: number, y: number): number {
    if (!this.bounds.contains(x, y)) {
      throw new RangeError(`Cell (${x}, ${y}) is outside cave bounds`);
    }
    return this.#cells[y * this.bounds.width + (x - this.bounds.minX)]!;
  }

  settledPointAt(index: number): CavePoint {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.#settledIndices.length) {
      throw new RangeError(`Settled grain index ${index} out of range`);
    }
    const flat = this.#settledIndices[index]!;
    const y = Math.floor(flat / this.bounds.width);
    const x = this.bounds.minX + (flat % this.bounds.width);
    return new CavePoint(x, y);
  }
}

function rasterizeSegment(cells: Int32Array, bounds: CaveBounds, a: CavePoint, b: CavePoint): void {
  const y0 = Math.max(0, Math.min(a.y, b.y));
  const y1 = Math.min(bounds.maxY, Math.max(a.y, b.y));
  const x0 = Math.max(bounds.minX, Math.min(a.x, b.x));
  const x1 = Math.min(bounds.maxX, Math.max(a.x, b.x));
  for (let y = y0; y <= y1; y += 1) {
    const rowOffset = y * bounds.width - bounds.minX;
    for (let x = x0; x <= x1; x += 1) cells[rowOffset + x] = CELL_ROCK;
  }
}

function rasterizeScan(cells: Int32Array, bounds: CaveBounds, scan: CaveScan): void {
  for (const path of scan.paths) {
    const pts = path.points;
    rasterizeSegment(cells, bounds, pts[0]!, pts[0]!);
    for (let i = 1; i < pts.length; i += 1) {
      rasterizeSegment(cells, bounds, pts[i - 1]!, pts[i]!);
    }
  }
  if (bounds.floorY !== null) {
    cells.fill(CELL_ROCK, bounds.floorY * bounds.width, (bounds.floorY + 1) * bounds.width);
  }
}

function extractEscapePath(stackX: Int32Array, stackY: Int32Array, depth: number): CavePoint[] {
  const path: CavePoint[] = [];
  for (let i = 0; i < depth; i += 1) {
    path.push(new CavePoint(stackX[i]!, stackY[i]!));
  }
  return path;
}

function nextAirX(cells: Int32Array, downIdx: number, x: number): number | null {
  if (cells[downIdx] === CELL_AIR) return x;
  if (cells[downIdx - 1] === CELL_AIR) return x - 1;
  if (cells[downIdx + 1] === CELL_AIR) return x + 1;
  return null;
}

function runSandDfs(
  cells: Int32Array,
  bounds: CaveBounds,
  policy: CaveBoundaryPolicy,
): { readonly settledIndices: Int32Array; readonly escapePath: CavePoint[] } {
  if (cells[SOURCE_Y * bounds.width + (SOURCE_X - bounds.minX)] !== CELL_AIR) {
    return { settledIndices: new Int32Array(0), escapePath: [] };
  }
  const stackX = new Int32Array(bounds.height);
  const stackY = new Int32Array(bounds.height);
  stackX[0] = SOURCE_X;
  stackY[0] = SOURCE_Y;
  let depth = 1;
  const settledIndices: number[] = [];
  while (depth > 0) {
    const x = stackX[depth - 1]!;
    const y = stackY[depth - 1]!;
    if (policy.isEscape(y, bounds)) break;
    const nextX = nextAirX(cells, (y + 1) * bounds.width - bounds.minX + x, x);
    if (nextX !== null) {
      stackX[depth] = nextX;
      stackY[depth] = y + 1;
      depth += 1;
    } else {
      const flat = y * bounds.width + (x - bounds.minX);
      cells[flat] = settledIndices.length + 1;
      settledIndices.push(flat);
      depth -= 1;
    }
  }
  return { settledIndices: Int32Array.from(settledIndices), escapePath: extractEscapePath(stackX, stackY, depth) };
}

/** Rasterizes cave rock paths and simulates sand pouring via stack-resumed DFS. */
export function simulateReservoir(scan: CaveScan, policy: CaveBoundaryPolicy): ReservoirField {
  const bounds = policy.computeBounds(scan);
  const cells = new Int32Array(bounds.cellCount);
  rasterizeScan(cells, bounds, scan);
  const { settledIndices, escapePath } = runSandDfs(cells, bounds, policy);
  return new ReservoirField(bounds, cells, settledIndices, escapePath);
}
