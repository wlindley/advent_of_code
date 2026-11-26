export const MIN_SAFE_STEP = 1;
export const MAX_SAFE_STEP = 3;

export type TrendDirection = 1 | -1;
export type StepViolationReason = 'flat' | 'reversal' | 'jump';

/** Validates that `value` is a safe integer and normalizes `-0` to `+0`. */
export function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value + 0;
}

/** Returns `true` iff transitioning from `prev` to `next` moves 1..3 in `expectedDirection`. */
export function isSafeStep(prev: number, next: number, expectedDirection: TrendDirection): boolean {
  const d = (next - prev) * expectedDirection;
  return d >= MIN_SAFE_STEP && d <= MAX_SAFE_STEP;
}

/** Classifies a step violation (`flat` > `reversal` > `jump`), or `null` when safe. */
export function classifyStepViolation(
  prev: number,
  next: number,
  expectedDirection: TrendDirection,
): StepViolationReason | null {
  const d = (next - prev) * expectedDirection;
  if (d === 0) return 'flat';
  if (d < 0) return 'reversal';
  if (d > MAX_SAFE_STEP) return 'jump';
  return null;
}

/** Immutable record of the first step violation encountered in a report. */
export class StepFailure {
  readonly index: number;
  readonly prev: number;
  readonly next: number;
  readonly reason: StepViolationReason;

  constructor(index: number, prev: number, next: number, reason: StepViolationReason) {
    const safeIndex = assertSafeInt(index, 'index');
    if (safeIndex < 0) {
      throw new RangeError(`index must be non-negative, got ${index}`);
    }
    this.index = safeIndex;
    this.prev = assertSafeInt(prev, 'prev');
    this.next = assertSafeInt(next, 'next');
    this.reason = reason;
    Object.freeze(this);
  }

  get delta(): number {
    return this.next - this.prev;
  }
}
