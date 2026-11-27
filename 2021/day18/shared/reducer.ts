import { computeBufferMagnitude, SnailfishLeaf, SnailfishNumber } from './snailfish';

export type ReductionActionKind = 'explode' | 'split';

export interface BufferReductionAction {
  readonly kind: ReductionActionKind;
  readonly focusIndex: number;
}

/** Single explode or split reduction step with the resulting immutable snailfish number. */
export class ReductionStep {
  constructor(
    readonly kind: ReductionActionKind,
    readonly focusIndex: number,
    readonly result: SnailfishNumber,
  ) {
    Object.freeze(this);
  }
}

/** Finds the leftmost leaf index of an adjacent pair nested at depth >= 5, or -1. */
export function findExplodeIndex(depths: readonly number[]): number {
  for (let i = 0; i < depths.length - 1; i += 1) {
    if (depths[i]! >= 5 && depths[i] === depths[i + 1]) {
      return i;
    }
  }
  return -1;
}

function findSplitIndex(values: readonly number[]): number {
  for (let i = 0; i < values.length; i += 1) {
    if (values[i]! >= 10) return i;
  }
  return -1;
}

function explodeAt(values: number[], depths: number[], index: number): void {
  const leftVal = values[index]!;
  const rightVal = values[index + 1]!;
  const newDepth = depths[index]! - 1;
  if (index > 0) values[index - 1]! += leftVal;
  if (index + 2 < values.length) values[index + 2]! += rightVal;
  values.splice(index, 2, 0);
  depths.splice(index, 2, newDepth);
}

function splitAt(values: number[], depths: number[], index: number): void {
  const value = values[index]!;
  const newDepth = depths[index]! + 1;
  values.splice(index, 1, Math.floor(value / 2), Math.ceil(value / 2));
  depths.splice(index, 1, newDepth, newDepth);
}

/** Applies one leftmost explode or split mutation on local value/depth buffers. */
export function stepReduceBuffers(
  values: number[],
  depths: number[],
): BufferReductionAction | null {
  const explodeIndex = findExplodeIndex(depths);
  if (explodeIndex >= 0) {
    explodeAt(values, depths, explodeIndex);
    return { kind: 'explode', focusIndex: explodeIndex };
  }
  const splitIndex = findSplitIndex(values);
  if (splitIndex >= 0) {
    splitAt(values, depths, splitIndex);
    return { kind: 'split', focusIndex: splitIndex };
  }
  return null;
}

/** Materializes an immutable `SnailfishNumber` from flat value/depth buffers. */
export function buffersToNumber(
  values: readonly number[],
  depths: readonly number[],
): SnailfishNumber {
  const leaves: SnailfishLeaf[] = [];
  for (let i = 0; i < values.length; i += 1) {
    leaves.push(new SnailfishLeaf(values[i]!, depths[i]!));
  }
  return new SnailfishNumber(leaves);
}

function extractBuffers(num: SnailfishNumber): { values: number[]; depths: number[] } {
  const values: number[] = [];
  const depths: number[] = [];
  for (const leaf of num.leaves) {
    values.push(leaf.value);
    depths.push(leaf.depth);
  }
  return { values, depths };
}

function combineBuffers(
  left: SnailfishNumber,
  right: SnailfishNumber,
): { values: number[]; depths: number[] } {
  const values: number[] = [];
  const depths: number[] = [];
  for (const leaf of left.leaves) {
    values.push(leaf.value);
    depths.push(leaf.depth + 1);
  }
  for (const leaf of right.leaves) {
    values.push(leaf.value);
    depths.push(leaf.depth + 1);
  }
  return { values, depths };
}

function reduceBuffers(values: number[], depths: number[]): void {
  while (stepReduceBuffers(values, depths) !== null) {
    // Mutation stays strictly encapsulated inside local buffers.
  }
}

/** Forms the unreduced snailfish pair `[left, right]` without mutating either operand. */
export function combineUnreduced(
  left: SnailfishNumber,
  right: SnailfishNumber,
): SnailfishNumber {
  const { values, depths } = combineBuffers(left, right);
  return buffersToNumber(values, depths);
}

/** Performs at most one explode or split reduction step on a snailfish number. */
export function stepReduceSnailfish(num: SnailfishNumber): ReductionStep | null {
  const { values, depths } = extractBuffers(num);
  const action = stepReduceBuffers(values, depths);
  if (action === null) return null;
  return new ReductionStep(action.kind, action.focusIndex, buffersToNumber(values, depths));
}

/** Fully reduces a snailfish number until no explode or split rules apply. */
export function reduceSnailfish(num: SnailfishNumber): SnailfishNumber {
  const { values, depths } = extractBuffers(num);
  reduceBuffers(values, depths);
  return buffersToNumber(values, depths);
}

/** Adds two snailfish numbers `[left, right]` and returns the fully reduced result. */
export function addSnailfish(left: SnailfishNumber, right: SnailfishNumber): SnailfishNumber {
  const { values, depths } = combineBuffers(left, right);
  reduceBuffers(values, depths);
  return buffersToNumber(values, depths);
}

/** Adds and reduces two snailfish numbers, returning only the final magnitude. */
export function addSnailfishMagnitude(
  left: SnailfishNumber,
  right: SnailfishNumber,
): number {
  const { values, depths } = combineBuffers(left, right);
  reduceBuffers(values, depths);
  return computeBufferMagnitude(values, depths);
}
