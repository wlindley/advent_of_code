import { encodeItemMask, extractSinglePriority, priorityToItem } from './priority';

/** Validates a raw rucksack string (non-empty, even length, ASCII letters only). */
export function validateRucksackRaw(raw: string, label: string): void {
  if (raw.length === 0) {
    throw new RangeError(`${label}: rucksack must not be empty`);
  }
  if (raw.length % 2 !== 0) {
    throw new RangeError(`${label}: rucksack length must be even, got ${raw.length}`);
  }
  if (!/^[a-zA-Z]+$/.test(raw)) {
    throw new RangeError(`${label}: rucksack must contain only [a-zA-Z]`);
  }
}

/** Immutable rucksack value object storing only `rucksackNumber` and `raw`. */
export class Rucksack {
  readonly rucksackNumber: number;
  readonly raw: string;

  constructor(rucksackNumber: number, raw: string) {
    if (!Number.isSafeInteger(rucksackNumber) || rucksackNumber < 1) {
      throw new RangeError(`rucksackNumber must be a positive safe integer, got ${rucksackNumber}`);
    }
    validateRucksackRaw(raw, 'raw');
    this.rucksackNumber = rucksackNumber;
    this.raw = raw;
    Object.freeze(this);
  }

  get midpoint(): number {
    return this.raw.length / 2;
  }

  get firstCompartment(): string {
    return this.raw.slice(0, this.midpoint);
  }

  get secondCompartment(): string {
    return this.raw.slice(this.midpoint);
  }

  get firstMask(): bigint {
    return encodeItemMask(this.firstCompartment);
  }

  get secondMask(): bigint {
    return encodeItemMask(this.secondCompartment);
  }

  get allMask(): bigint {
    return this.firstMask | this.secondMask;
  }

  get misplacedMask(): bigint {
    return this.firstMask & this.secondMask;
  }

  get misplacedPriority(): number {
    return extractSinglePriority(this.misplacedMask);
  }

  get misplacedItem(): string {
    return priorityToItem(this.misplacedPriority);
  }
}

/** Parses newline-delimited rucksack lines into frozen `Rucksack` instances. */
export function parseRucksacks(raw: string): readonly Rucksack[] {
  const lines = raw.split(/\r?\n/);
  const rucksacks: Rucksack[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    validateRucksackRaw(trimmed, `Line ${i + 1}`);
    rucksacks.push(new Rucksack(rucksacks.length + 1, trimmed));
  }
  if (rucksacks.length === 0) {
    throw new Error('Rucksack input must contain at least one rucksack');
  }
  return Object.freeze(rucksacks);
}
