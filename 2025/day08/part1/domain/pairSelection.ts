import { compareJunctionPairs, type JunctionPair, type Point3D } from '../../shared';

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

/** Selects the `pairCount` closest undirected pairs ordered by `(distSq, u, v)`. */
export function selectClosestPairs(
  points: readonly Point3D[],
  pairCount: number,
): readonly JunctionPair[] {
  if (!Number.isSafeInteger(pairCount) || pairCount < 0) {
    throw new RangeError(`pairCount must be a non-negative safe integer, got ${pairCount}`);
  }

  const n = points.length;
  const effectiveCount = Math.min(pairCount, (n * (n - 1)) / 2);
  if (effectiveCount === 0) return [];

  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const zs = new Float64Array(n);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < n; i += 1) {
    const p = points[i]!;
    xs[i] = p.x; ys[i] = p.y; zs[i] = p.z;
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }

  const dxSpan = BigInt(maxX) - BigInt(minX);
  const dySpan = BigInt(maxY) - BigInt(minY);
  const dzSpan = BigInt(maxZ) - BigInt(minZ);
  if (dxSpan * dxSpan + dySpan * dySpan + dzSpan * dzSpan > MAX_SAFE_BIGINT) {
    throw new RangeError('Coordinate span exceeds exact Number.MAX_SAFE_INTEGER squared distance');
  }

  const heapDist = new Float64Array(effectiveCount);
  const heapU = new Uint32Array(effectiveCount);
  const heapV = new Uint32Array(effectiveCount);
  let heapSize = 0;

  const isGreater = (i: number, j: number): boolean =>
    (heapDist[i]! - heapDist[j]! || heapU[i]! - heapU[j]! || heapV[i]! - heapV[j]!) > 0;

  const swap = (i: number, j: number): void => {
    const td = heapDist[i]!; heapDist[i] = heapDist[j]!; heapDist[j] = td;
    const tu = heapU[i]!; heapU[i] = heapU[j]!; heapU[j] = tu;
    const tv = heapV[i]!; heapV[i] = heapV[j]!; heapV[j] = tv;
  };

  const siftUp = (start: number): void => {
    for (let i = start; i > 0;) {
      const parent = (i - 1) >> 1;
      if (!isGreater(i, parent)) break;
      swap(i, parent);
      i = parent;
    }
  };

  const siftDown = (start: number): void => {
    for (let i = start;;) {
      const left = (i << 1) + 1;
      if (left >= heapSize) break;
      const right = left + 1;
      const best = right < heapSize && isGreater(right, left) ? right : left;
      if (!isGreater(best, i)) break;
      swap(i, best);
      i = best;
    }
  };

  for (let u = 0; u < n - 1; u += 1) {
    const ux = xs[u]!, uy = ys[u]!, uz = zs[u]!;
    for (let v = u + 1; v < n; v += 1) {
      const dx = ux - xs[v]!, dy = uy - ys[v]!, dz = uz - zs[v]!;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (heapSize < effectiveCount) {
        heapDist[heapSize] = distSq; heapU[heapSize] = u; heapV[heapSize] = v;
        siftUp(heapSize);
        heapSize += 1;
      } else {
        // Exact tie-safe prune: (u, v) streams strictly ascending, so distSq === heapDist[0] is strictly larger.
        if (distSq >= heapDist[0]!) continue;
        heapDist[0] = distSq; heapU[0] = u; heapV[0] = v;
        siftDown(0);
      }
    }
  }

  return Array.from({ length: heapSize }, (_, i) => ({
    u: heapU[i]!, v: heapV[i]!, distSq: heapDist[i]!,
  })).sort(compareJunctionPairs);
}
