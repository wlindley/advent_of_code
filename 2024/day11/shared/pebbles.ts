/** Multiplier applied to odd-digit non-zero stones on each blink. */
export const STONE_SCALE_FACTOR = 2024n;

/** The three mutually exclusive transformation rules for a single stone. */
export type BlinkRule = 'zero' | 'split' | 'scale';

/** Discriminated union describing the rule applied and resulting stone(s). */
export type StoneTransition =
  | { readonly rule: 'zero'; readonly outputs: readonly [1n] }
  | { readonly rule: 'split'; readonly outputs: readonly [bigint, bigint] }
  | { readonly rule: 'scale'; readonly outputs: readonly [bigint] };

const ZERO_TRANSITION: StoneTransition = Object.freeze({
  rule: 'zero',
  outputs: Object.freeze([1n] as const),
});

/** Applies one Plutonian blink rule to a non-negative integer stone. */
export function blinkStone(stone: bigint): StoneTransition {
  if (stone < 0n) {
    throw new RangeError(`Stone value must be non-negative, got ${stone}`);
  }
  if (stone === 0n) return ZERO_TRANSITION;
  const digits = stone.toString(10);
  if (digits.length % 2 === 0) {
    const mid = digits.length / 2;
    const left = BigInt(digits.slice(0, mid));
    const right = BigInt(digits.slice(mid));
    return Object.freeze({
      rule: 'split',
      outputs: Object.freeze([left, right] as const),
    });
  }
  return Object.freeze({
    rule: 'scale',
    outputs: Object.freeze([stone * STONE_SCALE_FACTOR] as const),
  });
}

/** Immutable ordered initial line of non-negative Plutonian pebble values. */
export class PebbleLine {
  readonly stones: readonly bigint[];

  constructor(stones: readonly bigint[]) {
    if (stones.length === 0) {
      throw new RangeError('Pebble line must contain at least one stone');
    }
    for (const stone of stones) {
      if (stone < 0n) {
        throw new RangeError(`Stone value must be non-negative, got ${stone}`);
      }
    }
    this.stones = Object.freeze([...stones]);
    Object.freeze(this);
  }

  /** Number of pebbles in the initial ordered line. */
  get length(): number {
    return this.stones.length;
  }

  /** Aggregates the line into an order-independent frequency histogram. */
  toHistogram(): Map<bigint, bigint> {
    const histogram = new Map<bigint, bigint>();
    for (const stone of this.stones) {
      histogram.set(stone, (histogram.get(stone) ?? 0n) + 1n);
    }
    return histogram;
  }
}

function parseStoneToken(token: string): bigint {
  if (!/^\d+$/.test(token)) {
    throw new SyntaxError(
      `Invalid stone token "${token}": expected non-negative integer digits`,
    );
  }
  return BigInt(token);
}

/** Parses whitespace-separated non-negative integer stone labels into a PebbleLine. */
export function parsePebbleLine(raw: string): PebbleLine {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new RangeError('Pebble line input cannot be empty');
  }
  return new PebbleLine(trimmed.split(/\s+/).map(parseStoneToken));
}
