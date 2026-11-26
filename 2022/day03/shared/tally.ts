import { assertPriority, PRIORITY_COUNT } from './priority';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function copyValidatedCounts(counts: readonly number[]): readonly number[] {
  if (counts.length !== PRIORITY_COUNT) {
    throw new RangeError(`PriorityTally requires ${PRIORITY_COUNT} counts, got ${counts.length}`);
  }
  const copy: number[] = [];
  for (const count of counts) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError(`Priority count must be a non-negative safe integer, got ${count}`);
    }
    copy.push(count);
  }
  return Object.freeze(copy);
}

/** Immutable 52-slot item-priority count snapshot with dynamic aggregate getters. */
export class PriorityTally {
  readonly counts: readonly number[];

  constructor(counts: readonly number[]) {
    this.counts = copyValidatedCounts(counts);
    Object.freeze(this);
  }

  get totalItems(): number {
    let total = 0;
    for (const count of this.counts) total += count;
    return total;
  }

  get totalPriority(): number {
    let total = 0;
    for (let i = 0; i < PRIORITY_COUNT; i += 1) {
      total += this.counts[i]! * (i + 1);
    }
    return total;
  }

  get distinctTypes(): number {
    let distinct = 0;
    for (const count of this.counts) {
      if (count > 0) distinct += 1;
    }
    return distinct;
  }

  get maxCount(): number {
    let max = 0;
    for (const count of this.counts) {
      if (count > max) max = count;
    }
    return max;
  }

  countOf(priority: number): number {
    assertPriority(priority);
    return this.counts[priority - 1]!;
  }
}
