export const PART1_TARGET_TURN = 2020;
export const PART2_TARGET_TURN = 30_000_000;
export const MAX_TRACE_TURN = 20_000;
export const DEFAULT_MAX_TRACE_STEPS = 200;
export const RECENT_WINDOW_SIZE = 16;
export const DENSE_TRACE_PREFIX = 16;
export const MAX_SUPPORTED_TURN = 0xffff_ffff;

/** Validates that a target turn is an integer in [1, MAX_SUPPORTED_TURN]. */
export function validateTargetTurn(targetTurn: number): number {
  if (!Number.isInteger(targetTurn) || targetTurn < 1 || targetTurn > MAX_SUPPORTED_TURN) {
    throw new RangeError(
      `targetTurn must be an integer in [1, ${MAX_SUPPORTED_TURN}], got ${targetTurn}`,
    );
  }
  return targetTurn;
}

/** Immutable starting sequence of non-negative safe integers for the memory game. */
export class StartingSequence {
  readonly values: readonly number[];

  constructor(values: readonly number[]) {
    if (values.length === 0) {
      throw new Error('Starting sequence must contain at least one number');
    }
    for (const value of values) {
      if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError(`Starting number must be a non-negative safe integer, got ${value}`);
      }
    }
    this.values = Object.freeze([...values]);
    Object.freeze(this);
  }

  /** Number of initial seed turns. */
  get length(): number {
    return this.values.length;
  }

  /** Largest value present in the starting seed sequence. */
  get maxInitialValue(): number {
    let max = 0;
    for (const value of this.values) {
      if (value > max) max = value;
    }
    return max;
  }
}

/** Parses a comma-separated list of non-negative integers into a StartingSequence. */
export function parseStartingSequence(raw: string): StartingSequence {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Starting sequence input must not be empty');
  }
  const parts = trimmed.split(',');
  const values: number[] = [];
  for (const rawPart of parts) {
    const token = rawPart.trim();
    if (!/^\d+$/.test(token)) {
      throw new Error(`Invalid starting number token: "${token}"`);
    }
    const parsed = Number(token);
    if (!Number.isSafeInteger(parsed)) {
      throw new RangeError(`Starting number exceeds safe integer range: "${token}"`);
    }
    values.push(parsed);
  }
  return new StartingSequence(values);
}
