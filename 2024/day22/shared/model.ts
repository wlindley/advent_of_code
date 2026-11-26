import { assertNonNegativeSafeInt, secretPrice } from './prng';

export const DELTA_MIN = -9;
export const DELTA_MAX = 9;
export const DELTA_OFFSET = 9;
export const DELTA_BASE = 19;
export const DELTA_KEY_SPACE = 130_321;
export const DELTA_ROLL_MOD = 6_859;
export const MIN_PRICE_WINDOW_SIZE = 8;
export const DEFAULT_PRICE_WINDOW_SIZE = 40;

export type DeltaSequence = readonly [number, number, number, number];

function assertDeltaKey(key: number): void {
  if (!Number.isSafeInteger(key) || key < 0 || key >= DELTA_KEY_SPACE) {
    throw new RangeError(`Delta key must be integer in [0, ${DELTA_KEY_SPACE - 1}], got ${key}`);
  }
}

/** Encodes a 4-element price delta sequence (`-9..9`) into `[0, 130_320]`. */
export function encodeDeltaSequence(deltas: DeltaSequence): number {
  let key = 0;
  for (const d of deltas) {
    if (!Number.isSafeInteger(d) || d < DELTA_MIN || d > DELTA_MAX) {
      throw new RangeError(`Delta must be integer in [-9, 9], got ${d}`);
    }
    key = key * DELTA_BASE + (d + DELTA_OFFSET);
  }
  return key;
}

/** Decodes an integer key in `[0, 130_320]` back to its 4-element delta sequence. */
export function decodeDeltaSequence(key: number): DeltaSequence {
  assertDeltaKey(key);
  let rem = key;
  const out = [0, 0, 0, 0];
  for (let i = 3; i >= 0; i -= 1) {
    out[i] = (rem % DELTA_BASE) - DELTA_OFFSET;
    rem = Math.floor(rem / DELTA_BASE);
  }
  return Object.freeze([out[0]!, out[1]!, out[2]!, out[3]!] as const);
}

/** Immutable initial and final secret outcome for a single buyer. */
export class BuyerOutcome {
  readonly buyerIndex: number;
  readonly initialSecret: number;
  readonly finalSecret: number;

  constructor(buyerIndex: number, initialSecret: number, finalSecret: number) {
    assertNonNegativeSafeInt(buyerIndex, 'buyerIndex');
    assertNonNegativeSafeInt(initialSecret, 'initialSecret');
    assertNonNegativeSafeInt(finalSecret, 'finalSecret');
    this.buyerIndex = buyerIndex;
    this.initialSecret = initialSecret;
    this.finalSecret = finalSecret;
    Object.freeze(this);
  }

  get finalPrice(): number { return secretPrice(this.finalSecret); }
}

/** Aggregate Part 1 result holding all evaluated buyers and derived `totalFinalSecret`. */
export class SecretSumResult {
  readonly steps: number;
  readonly buyers: readonly BuyerOutcome[];

  constructor(steps: number, buyers: readonly BuyerOutcome[]) {
    assertNonNegativeSafeInt(steps, 'steps');
    this.steps = steps;
    this.buyers = Object.freeze([...buyers]);
    Object.freeze(this);
  }

  get totalFinalSecret(): bigint {
    let total = 0n;
    for (const buyer of this.buyers) total += BigInt(buyer.finalSecret);
    return total;
  }
}

/** Ranked 4-delta trigger sequence candidate with aggregate banana yield. */
export class BananaSequenceCandidate {
  readonly key: number;
  readonly totalBananas: number;
  readonly matchedBuyers: number;

  constructor(key: number, totalBananas: number, matchedBuyers: number) {
    assertDeltaKey(key);
    assertNonNegativeSafeInt(totalBananas, 'totalBananas');
    assertNonNegativeSafeInt(matchedBuyers, 'matchedBuyers');
    this.key = key;
    this.totalBananas = totalBananas;
    this.matchedBuyers = matchedBuyers;
    Object.freeze(this);
  }

  get deltas(): DeltaSequence { return decodeDeltaSequence(this.key); }
  get label(): string { return this.deltas.join(','); }
}

/** Part 2 optimization leaderboard result with dynamic `bestCandidate` and `maxBananas`. */
export class MarketOptimizationResult {
  readonly steps: number;
  readonly buyerCount: number;
  readonly topCandidates: readonly BananaSequenceCandidate[];

  constructor(steps: number, buyerCount: number, topCandidates: readonly BananaSequenceCandidate[]) {
    assertNonNegativeSafeInt(steps, 'steps');
    assertNonNegativeSafeInt(buyerCount, 'buyerCount');
    this.steps = steps;
    this.buyerCount = buyerCount;
    this.topCandidates = Object.freeze([...topCandidates]);
    Object.freeze(this);
  }

  get bestCandidate(): BananaSequenceCandidate | null { return this.topCandidates.length > 0 ? this.topCandidates[0]! : null; }
  get maxBananas(): number { return this.bestCandidate === null ? 0 : this.bestCandidate.totalBananas; }
}

/** Bounded window of buyer prices around an optional first-match sell step. */
export class MarketPriceWindow {
  readonly startStep: number;
  readonly prices: readonly number[];
  readonly matchedStep: number | null;

  constructor(startStep: number, prices: readonly number[], matchedStep: number | null) {
    assertNonNegativeSafeInt(startStep, 'startStep');
    if (prices.length === 0) throw new RangeError('MarketPriceWindow requires at least one price');
    for (const p of prices) {
      if (!Number.isSafeInteger(p) || p < 0 || p > 9) throw new RangeError(`Price must be 0..9, got ${p}`);
    }
    if (matchedStep !== null && (!Number.isSafeInteger(matchedStep) || matchedStep < startStep + 4 || matchedStep > startStep + prices.length - 1)) {
      throw new RangeError(`matchedStep ${matchedStep} out of window [${startStep + 4}, ${startStep + prices.length - 1}]`);
    }
    this.startStep = startStep;
    this.prices = Object.freeze([...prices]);
    this.matchedStep = matchedStep;
    Object.freeze(this);
  }

  get endStep(): number { return this.startStep + this.prices.length - 1; }

  get deltas(): readonly (number | null)[] {
    const out: (number | null)[] = [null];
    for (let i = 1; i < this.prices.length; i += 1) out.push(this.prices[i]! - this.prices[i - 1]!);
    return Object.freeze(out);
  }

  get matchedPrice(): number | null {
    return this.matchedStep === null ? null : this.prices[this.matchedStep - this.startStep]!;
  }

  get matchedDeltas(): DeltaSequence | null {
    if (this.matchedStep === null) return null;
    const i = this.matchedStep - this.startStep;
    return Object.freeze([
      this.prices[i - 3]! - this.prices[i - 4]!,
      this.prices[i - 2]! - this.prices[i - 3]!,
      this.prices[i - 1]! - this.prices[i - 2]!,
      this.prices[i]! - this.prices[i - 1]!,
    ] as const);
  }
}
