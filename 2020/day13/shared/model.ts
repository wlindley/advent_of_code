import type { Congruence } from '../../../shared/core';

const TIMESTAMP_PATTERN = /^\d+$/;
const BUS_ID_PATTERN = /^[1-9]\d*$/;

function assertNonNegativeBigInt(value: bigint, label: string): void {
  if (value < 0n) {
    throw new RangeError(`${label} must be non-negative, got ${value}`);
  }
}

/** Immutable active shuttle bus entry with positive period and schedule offset. */
export class BusEntry {
  readonly id: bigint;
  readonly offset: bigint;

  constructor(id: bigint, offset: bigint) {
    if (id <= 0n) {
      throw new RangeError(`Bus id must be positive, got ${id}`);
    }
    assertNonNegativeBigInt(offset, 'Bus offset');
    this.id = id;
    this.offset = offset;
    Object.freeze(this);
  }

  /** Minutes to wait from `t` until the next departure of this bus. */
  waitFrom(t: bigint): bigint {
    assertNonNegativeBigInt(t, 'Timestamp');
    const rem = t % this.id;
    return rem === 0n ? 0n : this.id - rem;
  }

  /** Earliest departure timestamp at or after `t`. */
  nextDepartureFrom(t: bigint): bigint {
    return t + this.waitFrom(t);
  }

  /** Linear congruence `t ≡ -offset (mod id)` for Part 2 offset alignment. */
  get congruence(): Congruence {
    const rem = this.offset % this.id;
    return Object.freeze({ remainder: rem === 0n ? 0n : this.id - rem, modulus: this.id });
  }

  /** Returns true if this bus departs at `t + offset`. */
  departsWithOffsetAt(t: bigint): boolean {
    assertNonNegativeBigInt(t, 'Timestamp');
    return (t + this.offset) % this.id === 0n;
  }
}

function validateScheduleBuses(buses: readonly BusEntry[], slotCount: number): void {
  if (buses.length < 1) {
    throw new RangeError('BusSchedule requires at least one active bus');
  }
  if (!Number.isSafeInteger(slotCount) || slotCount < buses.length) {
    throw new RangeError(`slotCount must be an integer >= active bus count, got ${slotCount}`);
  }
  let prevOffset = -1n;
  const limit = BigInt(slotCount);
  for (const bus of buses) {
    if (bus.offset <= prevOffset || bus.offset >= limit) {
      throw new RangeError(`Invalid bus offset ${bus.offset} for slotCount ${slotCount}`);
    }
    prevOffset = bus.offset;
  }
}

/** Validated two-line shuttle schedule with earliest timestamp and active buses. */
export class BusSchedule {
  readonly earliestTimestamp: bigint;
  readonly buses: readonly BusEntry[];
  readonly slotCount: number;

  constructor(earliestTimestamp: bigint, buses: readonly BusEntry[], slotCount: number) {
    assertNonNegativeBigInt(earliestTimestamp, 'Earliest timestamp');
    validateScheduleBuses(buses, slotCount);
    this.earliestTimestamp = earliestTimestamp;
    this.buses = Object.freeze([...buses]);
    this.slotCount = slotCount;
    Object.freeze(this);
  }

  /** Number of active buses in the schedule. */
  get activeCount(): number {
    return this.buses.length;
  }

  /** Number of inactive (`x`) slots in the schedule. */
  get inactiveCount(): number {
    return this.slotCount - this.buses.length;
  }

  /** Congruence system derived from all active buses. */
  get congruences(): readonly Congruence[] {
    return Object.freeze(this.buses.map((bus) => bus.congruence));
  }
}

function parseBusToken(token: string, offset: number): BusEntry | null {
  const cleaned = token.trim();
  if (cleaned === 'x') return null;
  if (!BUS_ID_PATTERN.test(cleaned)) {
    throw new Error(`Invalid bus token at slot ${offset}: "${token}"`);
  }
  return new BusEntry(BigInt(cleaned), BigInt(offset));
}

/** Parses strict two-line AoC 2020 Day 13 shuttle notes into a `BusSchedule`. */
export function parseBusSchedule(raw: string): BusSchedule {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length !== 2) {
    throw new Error(`Expected exactly 2 schedule lines, got ${lines.length}`);
  }
  const timestampLine = lines[0]!.trim();
  if (!TIMESTAMP_PATTERN.test(timestampLine)) {
    throw new Error(`Invalid earliest timestamp: "${lines[0]}"`);
  }
  const tokens = lines[1]!.split(',');
  const buses: BusEntry[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const entry = parseBusToken(tokens[i]!, i);
    if (entry !== null) buses.push(entry);
  }
  return new BusSchedule(BigInt(timestampLine), buses, tokens.length);
}
