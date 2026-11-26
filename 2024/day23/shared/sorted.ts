/** Numeric ascending comparator for `Array.prototype.sort`. */
export function compareNumbers(a: number, b: number): number {
  return a - b;
}

/** Lexicographic comparator for sorted node-ID sequences. */
export function compareNodeIds(a: readonly number[], b: readonly number[]): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const diff = a[i]! - b[i]!;
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}

/** Returns the first index in `sorted` with value `>= target` (or `sorted.length`). */
export function lowerBound(sorted: readonly number[], target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Returns whether `target` exists in ascending `sorted` numbers. */
export function hasSortedNumber(sorted: readonly number[], target: number): boolean {
  const idx = lowerBound(sorted, target);
  return idx < sorted.length && sorted[idx] === target;
}

/** Binary search for `target` in ascending `sorted` strings; returns `-1` if absent. */
export function findSortedString(sorted: readonly string[], target: string): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const value = sorted[mid]!;
    if (value === target) return mid;
    if (value < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

/** Two-pointer intersection of two strictly ascending number arrays. */
export function intersectSorted(a: readonly number[], b: readonly number[]): readonly number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const av = a[i]!;
    const bv = b[j]!;
    if (av === bv) {
      result.push(av);
      i += 1;
      j += 1;
    } else if (av < bv) i += 1;
    else j += 1;
  }
  return Object.freeze(result);
}

/** Two-pointer set difference `a \ b` on strictly ascending number arrays. */
export function differenceSorted(a: readonly number[], b: readonly number[]): readonly number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const av = a[i]!;
    const bv = b[j]!;
    if (av === bv) {
      i += 1;
      j += 1;
    } else if (av < bv) {
      result.push(av);
      i += 1;
    } else j += 1;
  }
  while (i < a.length) {
    result.push(a[i]!);
    i += 1;
  }
  return Object.freeze(result);
}
