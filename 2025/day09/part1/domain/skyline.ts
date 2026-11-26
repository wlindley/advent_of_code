export interface IndexedTile {
  readonly index: number;
  readonly x: bigint;
  readonly y: bigint;
}

export interface SwNeFrontiers {
  readonly sw: readonly IndexedTile[];
  readonly ne: readonly IndexedTile[];
}

export interface MonotoneProbe {
  readonly probeIndex: number;
  readonly matchedIndex: number;
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly score: bigint;
}

function compareByXYIndex(a: IndexedTile, b: IndexedTile): number {
  if (a.x < b.x) return -1;
  if (a.x > b.x) return 1;
  if (a.y < b.y) return -1;
  if (a.y > b.y) return 1;
  return a.index - b.index;
}

function rawScore(a: IndexedTile, b: IndexedTile): bigint {
  return (b.x - a.x + 1n) * (b.y - a.y + 1n);
}

/**
 * Extracts minimal South-West and maximal North-East Pareto staircases in strictly
 * increasing X and strictly decreasing Y order.
 * Duplicate coordinates keep the smallest index in `sw` and largest index in `ne`
 * so `extractSwNeFrontiers` can pair duplicate tiles as distinct indices.
 */
export function extractSwNeFrontiers(tiles: readonly IndexedTile[]): SwNeFrontiers {
  if (tiles.length === 0) {
    throw new Error('Cannot extract skyline frontiers from an empty tile list');
  }
  const sorted = [...tiles].sort(compareByXYIndex);
  const sw: IndexedTile[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i]!;
    if (sw.length === 0 || t.y < sw[sw.length - 1]!.y) {
      sw.push(t);
    }
  }
  const ne: IndexedTile[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = sorted[i]!;
    if (ne.length === 0 || t.y > ne[ne.length - 1]!.y) {
      ne.push(t);
    }
  }
  ne.reverse();
  return Object.freeze({ sw: Object.freeze(sw), ne: Object.freeze(ne) });
}

/**
 * Runs O((|SW| + |NE|) log |SW|) Monotone Divide-and-Conquer over `sw x ne`.
 */
export function searchMonotoneMax(
  frontiers: SwNeFrontiers,
  onProbe: (probe: MonotoneProbe) => void,
): void {
  const { sw, ne } = frontiers;
  if (sw.length === 0 || ne.length === 0) return;

  // CRITICAL INVARIANT: Evaluate raw UNCLAMPED `(b.x - a.x + 1n) * (b.y - a.y + 1n)`
  // across jLo..jHi and NEVER skip `a.index === b.index` during `bestJ` selection.
  // Because `sw` and `ne` share the same source points, `rawScore` is strictly concave-Monge
  // everywhere and every invalid pair (X_j < x_i XOR Y_j < y_i) has score <= 0n < 1n.
  const solve = (iLo: number, iHi: number, jLo: number, jHi: number): void => {
    if (iLo > iHi) return;
    const mid = (iLo + iHi) >> 1;
    const a = sw[mid]!;
    let bestJ = jLo;
    let bestScore = rawScore(a, ne[jLo]!);
    for (let j = jLo + 1; j <= jHi; j++) {
      const score = rawScore(a, ne[j]!);
      if (score > bestScore) {
        bestScore = score;
        bestJ = j;
      }
    }
    onProbe({
      probeIndex: a.index,
      matchedIndex: ne[bestJ]!.index,
      windowStart: jLo,
      windowEnd: jHi,
      score: bestScore,
    });
    solve(iLo, mid - 1, jLo, bestJ);
    solve(mid + 1, iHi, bestJ, jHi);
  };

  solve(0, sw.length - 1, 0, ne.length - 1);
}
