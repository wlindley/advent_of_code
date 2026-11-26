import { DIRS_4 } from '../../../shared/core';
import type { GridCoord, Heightmap } from './heightmap';

/** Strict local minimum cell within a `Heightmap`. */
export class LowPoint {
  readonly row: number;
  readonly col: number;
  readonly height: number;
  constructor(row: number, col: number, height: number) {
    this.row = row; this.col = col; this.height = height; Object.freeze(this);
  }
  get riskLevel(): number { return this.height + 1; }
}

/** Connected non-ridge (`height < 9`) basin component with BFS wave depth metadata. */
export class Basin {
  readonly id: number;
  readonly seed: GridCoord;
  readonly size: number;
  readonly maxWaveDepth: number;
  readonly lowPoints: readonly LowPoint[];
  constructor(id: number, seed: GridCoord, size: number, maxWaveDepth: number, lowPoints: readonly LowPoint[]) {
    this.id = id; this.seed = Object.freeze({ row: seed.row, col: seed.col });
    this.size = size; this.maxWaveDepth = maxWaveDepth;
    this.lowPoints = Object.freeze(lowPoints.slice()); Object.freeze(this);
  }
}

/** Complete low-point and basin flood analysis for a `Heightmap`. */
export class HeightmapAnalysis {
  readonly heightmap: Heightmap;
  readonly lowPoints: readonly LowPoint[];
  readonly basins: readonly Basin[];
  private readonly basinIds: Int32Array;
  private readonly waveDepths: Int32Array;
  constructor(heightmap: Heightmap, lowPoints: readonly LowPoint[], basins: readonly Basin[], basinIds: Int32Array, waveDepths: Int32Array) {
    this.heightmap = heightmap; this.lowPoints = Object.freeze(lowPoints.slice());
    this.basins = Object.freeze(basins.slice()); this.basinIds = basinIds; this.waveDepths = waveDepths;
    Object.freeze(this);
  }
  get totalRiskLevel(): number {
    let sum = 0;
    for (const lp of this.lowPoints) sum += lp.riskLevel;
    return sum;
  }
  get maxWaveDepth(): number {
    if (this.basins.length === 0) return -1;
    let maxDepth = 0;
    for (const basin of this.basins) if (basin.maxWaveDepth > maxDepth) maxDepth = basin.maxWaveDepth;
    return maxDepth;
  }
  private indexOf(row: number, col: number): number {
    if (!this.heightmap.inBounds(row, col)) throw new RangeError(`Coordinates (${row}, ${col}) out of bounds`);
    return row * this.heightmap.cols + col;
  }
  basinIdAt(row: number, col: number): number | null {
    const id = this.basinIds[this.indexOf(row, col)]!;
    return id < 0 ? null : id;
  }
  waveDepthAt(row: number, col: number): number | null {
    const depth = this.waveDepths[this.indexOf(row, col)]!;
    return depth < 0 ? null : depth;
  }
}

function collectLowPoints(heightmap: Heightmap): LowPoint[] {
  const lowPoints: LowPoint[] = [];
  for (let r = 0; r < heightmap.rows; r += 1) {
    for (let c = 0; c < heightmap.cols; c += 1) {
      if (heightmap.isLowPoint(r, c)) lowPoints.push(new LowPoint(r, c, heightmap.at(r, c)));
    }
  }
  return lowPoints;
}

function floodBasin(
  heightmap: Heightmap, seedRow: number, seedCol: number, basinId: number,
  basinIds: Int32Array, waveDepths: Int32Array, queue: Int32Array,
): { size: number; maxWaveDepth: number } {
  const cols = heightmap.cols;
  let head = 0;
  let tail = 1;
  let maxWaveDepth = 0;
  const startIdx = seedRow * cols + seedCol;
  basinIds[startIdx] = basinId;
  waveDepths[startIdx] = 0;
  queue[0] = startIdx;
  while (head < tail) {
    const idx = queue[head++]!;
    const r = Math.floor(idx / cols);
    const c = idx - r * cols;
    const nextDepth = waveDepths[idx]! + 1;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (!heightmap.inBounds(nr, nc)) continue;
      const nIdx = nr * cols + nc;
      if (basinIds[nIdx] !== -1 || heightmap.isRidge(nr, nc)) continue;
      basinIds[nIdx] = basinId;
      waveDepths[nIdx] = nextDepth;
      queue[tail++] = nIdx;
      if (nextDepth > maxWaveDepth) maxWaveDepth = nextDepth;
    }
  }
  return { size: tail, maxWaveDepth };
}

/** Identifies strict low points and floods non-ridge (`height < 9`) 4-connected basins. */
export function analyzeHeightmap(heightmap: Heightmap): HeightmapAnalysis {
  const lowPoints = collectLowPoints(heightmap);
  const cols = heightmap.cols;
  const basinIds = new Int32Array(heightmap.size).fill(-1);
  const waveDepths = new Int32Array(heightmap.size).fill(-1);
  const queue = new Int32Array(heightmap.size);
  const seeds: GridCoord[] = [];
  const stats: { size: number; maxWaveDepth: number }[] = [];
  for (const lp of lowPoints) {
    if (heightmap.isRidge(lp.row, lp.col) || basinIds[lp.row * cols + lp.col] !== -1) continue;
    stats.push(floodBasin(heightmap, lp.row, lp.col, seeds.length, basinIds, waveDepths, queue));
    seeds.push({ row: lp.row, col: lp.col });
  }
  for (let r = 0; r < heightmap.rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (basinIds[r * cols + c] !== -1 || heightmap.isRidge(r, c)) continue;
      stats.push(floodBasin(heightmap, r, c, seeds.length, basinIds, waveDepths, queue));
      seeds.push({ row: r, col: c });
    }
  }
  const byBasin: LowPoint[][] = Array.from({ length: seeds.length }, () => []);
  for (const lp of lowPoints) {
    const bid = basinIds[lp.row * cols + lp.col]!;
    if (bid >= 0) byBasin[bid]!.push(lp);
  }
  const basins = seeds.map((seed, id) => new Basin(id, seed, stats[id]!.size, stats[id]!.maxWaveDepth, byBasin[id]!));
  return new HeightmapAnalysis(heightmap, lowPoints, basins, basinIds, waveDepths);
}
