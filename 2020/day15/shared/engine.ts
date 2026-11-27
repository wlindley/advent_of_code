import { PART2_TARGET_TURN, StartingSequence, validateTargetTurn } from './model';

export type TurnOrigin = 'seed' | 'novel' | 'repeat';

export interface RecentTurnEntry {
  readonly turn: number;
  readonly spoken: number;
  readonly origin: TurnOrigin;
  readonly considered: number | null;
  readonly previousTurn: number | null;
}

/**
 * Hybrid dense-array + overflow-Map table tracking the most recent turn each value was spoken.
 * Encapsulates mutable storage strictly for tight-loop O(1) simulation performance.
 */
export class LastSeenTable {
  private readonly dense: Uint32Array;
  private readonly overflow = new Map<number, number>();

  constructor(denseLimit: number) {
    if (!Number.isInteger(denseLimit) || denseLimit < 0) {
      throw new RangeError(`denseLimit must be a non-negative integer, got ${denseLimit}`);
    }
    this.dense = new Uint32Array(denseLimit);
  }

  /** Records `turn` for `value` and returns its prior seen turn (or 0 if unseen). */
  exchange(value: number, turn: number): number {
    if (value < this.dense.length) {
      const previous = this.dense[value]!;
      this.dense[value] = turn;
      return previous;
    }
    const previous = this.overflow.get(value) ?? 0;
    this.overflow.set(value, turn);
    return previous;
  }
}

/** Bounded circular buffer retaining the most recent turn entries in chronological order. */
export class RecentTurnBuffer {
  private readonly slots: (RecentTurnEntry | undefined)[];
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`capacity must be a positive integer, got ${capacity}`);
    }
    this.slots = new Array<RecentTurnEntry | undefined>(capacity);
  }

  /** Appends an immutable copy of `entry`, overwriting the oldest slot when full. */
  push(entry: RecentTurnEntry): void {
    const frozen = Object.freeze({ ...entry });
    const capacity = this.slots.length;
    if (this.count < capacity) {
      this.slots[(this.head + this.count) % capacity] = frozen;
      this.count += 1;
      return;
    }
    this.slots[this.head] = frozen;
    this.head = (this.head + 1) % capacity;
  }

  /** Returns a frozen chronological snapshot of retained entries. */
  snapshot(): readonly RecentTurnEntry[] {
    const capacity = this.slots.length;
    const entries: RecentTurnEntry[] = [];
    for (let i = 0; i < this.count; i += 1) {
      entries.push(this.slots[(this.head + i) % capacity]!);
    }
    return Object.freeze(entries);
  }
}

/**
 * Executes the memory game up to `targetTurn` using the Commit-on-Speak invariant:
 * a spoken value is exchanged into `LastSeenTable` on its own turn, and the returned
 * prior turn determines the subsequent turn's age.
 */
export function playMemoryGame(sequence: StartingSequence, targetTurn: number): number {
  const validTarget = validateTargetTurn(targetTurn);
  const values = sequence.values;
  if (validTarget <= values.length) {
    return values[validTarget - 1]!;
  }

  const table = new LastSeenTable(Math.min(validTarget, PART2_TARGET_TURN));
  let prevLookup = 0;
  let spoken = 0;

  for (let turn = 1; turn <= values.length; turn += 1) {
    spoken = values[turn - 1]!;
    prevLookup = table.exchange(spoken, turn);
  }

  for (let turn = values.length + 1; turn <= validTarget; turn += 1) {
    spoken = prevLookup === 0 ? 0 : turn - 1 - prevLookup;
    prevLookup = table.exchange(spoken, turn);
  }

  return spoken;
}
