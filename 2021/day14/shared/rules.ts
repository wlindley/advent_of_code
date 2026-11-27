export const PAIR_RE = /^[A-Z]{2}$/;
export const ELEMENT_RE = /^[A-Z]$/;

export interface ElementFrequency {
  readonly element: string;
  readonly count: bigint;
}

export interface PairReaction {
  readonly pair: string;
  readonly insert: string;
  readonly count: bigint;
}

/** Validates a non-negative safe integer step count. */
export function validateStepCount(steps: number): number {
  if (!Number.isSafeInteger(steps) || steps < 0) {
    throw new RangeError(`steps must be a non-negative safe integer, got ${steps}`);
  }
  return steps;
}

/** Increments a BigInt pair/element count inside a mutable Map accumulator. */
export function addPairCount(target: Map<string, bigint>, pair: string, delta: bigint): void {
  target.set(pair, (target.get(pair) ?? 0n) + delta);
}

/** Sorts element frequencies descending by count, ascending by symbol. */
export function compareFrequency(a: ElementFrequency, b: ElementFrequency): number {
  if (b.count > a.count) return 1;
  if (b.count < a.count) return -1;
  return a.element.charCodeAt(0) - b.element.charCodeAt(0);
}

/** Sorts pair reactions descending by count, ascending by pair key. */
export function compareReaction(a: PairReaction, b: PairReaction): number {
  if (b.count > a.count) return 1;
  if (b.count < a.count) return -1;
  return a.pair.localeCompare(b.pair, 'en');
}

/** Immutable pair-insertion rule producing left and right child pairs. */
export class InsertionRule {
  readonly pair: string;
  readonly insert: string;

  constructor(pair: string, insert: string) {
    if (!PAIR_RE.test(pair)) {
      throw new RangeError(`InsertionRule pair must match /^[A-Z]{2}$/, got "${pair}"`);
    }
    if (!ELEMENT_RE.test(insert)) {
      throw new RangeError(`InsertionRule insert must match /^[A-Z]$/, got "${insert}"`);
    }
    this.pair = pair;
    this.insert = insert;
    Object.freeze(this);
  }

  get leftProduct(): string {
    return this.pair.slice(0, 1) + this.insert;
  }

  get rightProduct(): string {
    return this.insert + this.pair.slice(1, 2);
  }
}
