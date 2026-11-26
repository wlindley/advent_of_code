import { bitCount } from '../../../shared/core';
import type { MirrorPattern } from './pattern';

/** Reflection axis direction: vertical (between columns) or horizontal (between rows). */
export type ReflectionOrientation = 'vertical' | 'horizontal';

/** Zero-based coordinate `(row, col)` within a `MirrorPattern`. */
export interface GridCoord {
  readonly row: number;
  readonly col: number;
}

/** Pair of mirrored coordinates whose terrain cells differ across a reflection axis. */
export interface SmudgePair {
  readonly near: GridCoord;
  readonly far: GridCoord;
}

function freezeMismatchPair(pair: SmudgePair): SmudgePair {
  return Object.freeze({
    near: Object.freeze({ row: pair.near.row, col: pair.near.col }),
    far: Object.freeze({ row: pair.far.row, col: pair.far.col }),
  });
}

/** Immutable reflection match storing orientation, 1-based line count before axis, and mismatch pairs. */
export class ReflectionMatch {
  readonly orientation: ReflectionOrientation;
  readonly index: number;
  readonly mismatches: readonly SmudgePair[];

  constructor(
    orientation: ReflectionOrientation,
    index: number,
    mismatches: readonly SmudgePair[],
  ) {
    if (!Number.isSafeInteger(index) || index < 1) {
      throw new RangeError(`Reflection index must be a positive safe integer, got ${index}`);
    }
    this.orientation = orientation;
    this.index = index;
    this.mismatches = Object.freeze(mismatches.map(freezeMismatchPair));
    Object.freeze(this);
  }

  get score(): number {
    return this.orientation === 'horizontal' ? this.index * 100 : this.index;
  }

  get smudgeCount(): number {
    return this.mismatches.length;
  }

  /** Returns the reflected coordinate across this axis, or `null` if it overhangs the grid. */
  mirrorOf(row: number, col: number, pattern: MirrorPattern): GridCoord | null {
    if (this.orientation === 'vertical') {
      const mirroredCol = 2 * this.index - 1 - col;
      return mirroredCol >= 0 && mirroredCol < pattern.width ? { row, col: mirroredCol } : null;
    }
    const mirroredRow = 2 * this.index - 1 - row;
    return mirroredRow >= 0 && mirroredRow < pattern.height ? { row: mirroredRow, col } : null;
  }
}

/** Validates that `targetSmudges` is a non-negative safe integer. */
export function validateTargetSmudges(targetSmudges: number): void {
  if (!Number.isSafeInteger(targetSmudges) || targetSmudges < 0) {
    throw new RangeError(`targetSmudges must be a non-negative safe integer, got ${targetSmudges}`);
  }
}

function makeMismatchPair(
  orientation: ReflectionOrientation,
  nearIdx: number,
  farIdx: number,
  bitIndex: number,
): SmudgePair {
  return orientation === 'vertical'
    ? { near: { row: bitIndex, col: nearIdx }, far: { row: bitIndex, col: farIdx } }
    : { near: { row: nearIdx, col: bitIndex }, far: { row: farIdx, col: bitIndex } };
}

function countAxisSmudges(masks: readonly bigint[], axis: number, limit: number): number {
  let total = 0;
  for (let offset = 0; axis - 1 - offset >= 0 && axis + offset < masks.length; offset += 1) {
    total += bitCount(masks[axis - 1 - offset]! ^ masks[axis + offset]!);
    if (total > limit) return total;
  }
  return total;
}

function extractMismatches(
  masks: readonly bigint[],
  axis: number,
  orientation: ReflectionOrientation,
): readonly SmudgePair[] {
  const pairs: SmudgePair[] = [];
  for (let offset = 0; axis - 1 - offset >= 0 && axis + offset < masks.length; offset += 1) {
    const nearIdx = axis - 1 - offset;
    const farIdx = axis + offset;
    let xor = masks[nearIdx]! ^ masks[farIdx]!;
    while (xor !== 0n) {
      const lowBit = xor & -xor;
      const bitIndex = lowBit.toString(2).length - 1;
      pairs.push(makeMismatchPair(orientation, nearIdx, farIdx, bitIndex));
      xor &= xor - 1n;
    }
  }
  return pairs;
}

function findAxisMatches(
  masks: readonly bigint[],
  orientation: ReflectionOrientation,
  targetSmudges: number,
): ReflectionMatch[] {
  const matches: ReflectionMatch[] = [];
  for (let axis = 1; axis < masks.length; axis += 1) {
    if (countAxisSmudges(masks, axis, targetSmudges) === targetSmudges) {
      matches.push(
        new ReflectionMatch(orientation, axis, extractMismatches(masks, axis, orientation)),
      );
    }
  }
  return matches;
}

/** Finds the unique vertical or horizontal reflection with exactly `targetSmudges` mismatches. */
export function findReflection(
  pattern: MirrorPattern,
  targetSmudges: number,
): ReflectionMatch {
  validateTargetSmudges(targetSmudges);
  const matches = [
    ...findAxisMatches(pattern.encodeColMasks(), 'vertical', targetSmudges),
    ...findAxisMatches(pattern.encodeRowMasks(), 'horizontal', targetSmudges),
  ];
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly 1 reflection with ${targetSmudges} smudges, found ${matches.length}`,
    );
  }
  return matches[0]!;
}

/** Sums reflection summary scores across all patterns for `targetSmudges`. */
export function summarizePatterns(
  patterns: readonly MirrorPattern[],
  targetSmudges: number,
): number {
  validateTargetSmudges(targetSmudges);
  let total = 0;
  for (const pattern of patterns) {
    total += findReflection(pattern, targetSmudges).score;
  }
  return total;
}
