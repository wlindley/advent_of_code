import { type TilePoint, type TileRect } from '../../shared';

export interface CompressedSlab {
  readonly start: bigint;
  readonly end: bigint;
  readonly isPoint: boolean;
}

/** Strictly ordered, gap-preserving 1D coordinate compression over arbitrary BigInt values. */
export class CompressedAxis {
  readonly slabs: readonly CompressedSlab[];
  private readonly pointIndex: ReadonlyMap<bigint, number>;

  constructor(coords: Iterable<bigint>) {
    const unique = Array.from(new Set(coords)).sort((a, b) => (a < b ? -1 : 1));
    if (unique.length === 0) throw new Error('CompressedAxis requires at least one coordinate');
    const slabs: CompressedSlab[] = [], index = new Map<bigint, number>();
    for (let i = 0; i < unique.length; i++) {
      const u = unique[i]!;
      index.set(u, slabs.length);
      slabs.push(Object.freeze({ start: u, end: u, isPoint: true }));
      // Only insert a gap slab when integers strictly exist between consecutive coordinates.
      if (i + 1 < unique.length && unique[i + 1]! - u > 1n) {
        slabs.push(Object.freeze({ start: u + 1n, end: unique[i + 1]! - 1n, isPoint: false }));
      }
    }
    this.slabs = Object.freeze(slabs); this.pointIndex = index; Object.freeze(this);
  }

  get size(): number { return this.slabs.length; }
  indexOfPoint(value: bigint): number {
    const idx = this.pointIndex.get(value);
    if (idx === undefined) throw new RangeError(`Coordinate ${value.toString()} not on axis`);
    return idx;
  }
}

/** Compressed 2D orthogonal polygon occupancy grid with O(1) prefix-sum rectangle validation. */
export class PolygonTileGrid {
  readonly xAxis: CompressedAxis;
  readonly yAxis: CompressedAxis;
  private readonly invalidPrefix: Int32Array;

  constructor(vertices: readonly TilePoint[]) {
    const n = vertices.length;
    if (n < 4) throw new Error(`Orthogonal polygon requires at least 4 vertices, got ${n}`);
    for (let i = 0; i < n; i++) {
      const a = vertices[i]!, b = vertices[(i + 1) % n]!;
      if (a.x === b.x && a.y === b.y) throw new Error(`Zero-length polygon edge at vertex index ${i}`);
      if (a.x !== b.x && a.y !== b.y) throw new Error(`Diagonal polygon edge at vertex index ${i}`);
    }
    this.xAxis = new CompressedAxis(vertices.map((v) => v.x));
    this.yAxis = new CompressedAxis(vertices.map((v) => v.y));
    const cols = this.xAxis.size, rows = this.yAxis.size;
    const boundary = new Uint8Array(rows * cols), parityDiff = new Uint8Array(rows * cols);

    for (let i = 0; i < n; i++) {
      const a = vertices[i]!, b = vertices[(i + 1) % n]!;
      const cx1 = this.xAxis.indexOfPoint(a.x), cy1 = this.yAxis.indexOfPoint(a.y);
      const cx2 = this.xAxis.indexOfPoint(b.x), cy2 = this.yAxis.indexOfPoint(b.y);
      if (cx1 === cx2) {
        const lo = Math.min(cy1, cy2), hi = Math.max(cy1, cy2);
        for (let cy = lo; cy <= hi; cy++) boundary[cy * cols + cx1] = 1;
        // Half-open [lo, hi) corresponds to a ray at y + 0.5, avoiding vertex/horizontal double-toggles.
        for (let cy = lo; cy < hi; cy++) parityDiff[cy * cols + cx1] = parityDiff[cy * cols + cx1]! ^ 1;
      } else {
        const lo = Math.min(cx1, cx2), hi = Math.max(cx1, cx2);
        for (let cx = lo; cx <= hi; cx++) boundary[cy1 * cols + cx] = 1;
      }
    }

    const stride = cols + 1, prefix = new Int32Array((rows + 1) * stride);
    for (let cy = 0; cy < rows; cy++) {
      let inside = 0;
      const rowOff = cy * cols, pRow = (cy + 1) * stride, prevRow = cy * stride;
      for (let cx = 0; cx < cols; cx++) {
        inside ^= parityDiff[rowOff + cx]!;
        const isInvalid = boundary[rowOff + cx] === 0 && inside === 0 ? 1 : 0;
        prefix[pRow + cx + 1] = isInvalid + prefix[prevRow + cx + 1]! + prefix[pRow + cx]! - prefix[prevRow + cx]!;
      }
    }
    this.invalidPrefix = prefix; Object.freeze(this);
  }

  get width(): number { return this.xAxis.size; }
  get height(): number { return this.yAxis.size; }
  private assertInBounds(index: number, limit: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= limit) throw new RangeError(`Index ${index} out of [0, ${limit})`);
  }

  invalidCellsInBox(x1: number, y1: number, x2: number, y2: number): number {
    this.assertInBounds(x1, this.width); this.assertInBounds(x2, this.width);
    this.assertInBounds(y1, this.height); this.assertInBounds(y2, this.height);
    const loX = Math.min(x1, x2), hiX = Math.max(x1, x2), loY = Math.min(y1, y2), hiY = Math.max(y1, y2), s = this.width + 1;
    return this.invalidPrefix[(hiY + 1) * s + (hiX + 1)]! - this.invalidPrefix[loY * s + (hiX + 1)]!
      - this.invalidPrefix[(hiY + 1) * s + loX]! + this.invalidPrefix[loY * s + loX]!;
  }

  isCellValid(cx: number, cy: number): boolean { return this.invalidCellsInBox(cx, cy, cx, cy) === 0; }

  invalidCellsInRect(rect: TileRect): number {
    return this.invalidCellsInBox(
      this.xAxis.indexOfPoint(rect.minX), this.yAxis.indexOfPoint(rect.minY),
      this.xAxis.indexOfPoint(rect.maxX), this.yAxis.indexOfPoint(rect.maxY),
    );
  }

  containsRect(rect: TileRect): boolean { return this.invalidCellsInRect(rect) === 0; }
}
