import {
  STRIPE_COLORS,
  STRIPE_COUNT,
  type StripeColor,
  type StripeIndex,
  assertValidStripeSequence,
  stripeToIndex,
} from './model';

export const NO_CHILD = -1;

function insertPattern(
  pattern: string,
  children: Int32Array,
  terminal: Uint8Array,
  state: { nodeCount: number; patternCount: number },
): void {
  let node = 0;
  for (let i = 0; i < pattern.length; i += 1) {
    const slot = node * STRIPE_COUNT + stripeToIndex(pattern[i]!);
    let nextNode = children[slot]!;
    if (nextNode === NO_CHILD) {
      nextNode = state.nodeCount;
      state.nodeCount += 1;
      children[slot] = nextNode;
    }
    node = nextNode;
  }
  if (terminal[node]! === 0) {
    terminal[node] = 1;
    state.patternCount += 1;
  }
}

/** Flat TypedArray-backed 5-way prefix trie of available towel stripe patterns. */
export class PatternTrie {
  readonly #children: Int32Array;
  readonly #terminal: Uint8Array;
  readonly #patternCount: number;
  readonly #maxPatternLength: number;

  private constructor(
    children: Int32Array,
    terminal: Uint8Array,
    patternCount: number,
    maxPatternLength: number,
  ) {
    this.#children = children;
    this.#terminal = terminal;
    this.#patternCount = patternCount;
    this.#maxPatternLength = maxPatternLength;
    // Freeze only the facade; never freeze TypedArrays (throws TypeError in JS).
    Object.freeze(this);
  }

  /** Builds a compact prefix trie from validated stripe patterns. */
  static fromPatterns(patterns: readonly string[]): PatternTrie {
    let totalChars = 0;
    let maxPatternLength = 0;
    for (const pattern of patterns) {
      assertValidStripeSequence(pattern, 'pattern');
      totalChars += pattern.length;
      if (pattern.length > maxPatternLength) maxPatternLength = pattern.length;
    }

    const capacity = 1 + totalChars;
    const children = new Int32Array(capacity * STRIPE_COUNT).fill(NO_CHILD);
    const terminal = new Uint8Array(capacity);
    const state = { nodeCount: 1, patternCount: 0 };

    for (const pattern of patterns) {
      insertPattern(pattern, children, terminal, state);
    }

    return new PatternTrie(
      children.slice(0, state.nodeCount * STRIPE_COUNT),
      terminal.slice(0, state.nodeCount),
      state.patternCount,
      maxPatternLength,
    );
  }

  get nodeCount(): number { return this.#terminal.length; }
  get patternCount(): number { return this.#patternCount; }
  get maxPatternLength(): number { return this.#maxPatternLength; }

  #assertNodeIndex(node: number): void {
    if (!Number.isInteger(node) || node < 0 || node >= this.#terminal.length) {
      throw new RangeError(`Trie node ${node} out of bounds [0, ${this.#terminal.length - 1}]`);
    }
  }

  #assertColorIndex(colorIndex: number): void {
    if (!Number.isInteger(colorIndex) || colorIndex < 0 || colorIndex >= STRIPE_COUNT) {
      throw new RangeError(`Stripe index ${colorIndex} out of bounds [0, ${STRIPE_COUNT - 1}]`);
    }
  }

  next(node: number, colorIndex: StripeIndex | number): number {
    this.#assertNodeIndex(node);
    this.#assertColorIndex(colorIndex);
    return this.#children[node * STRIPE_COUNT + colorIndex]!;
  }

  isTerminal(node: number): boolean {
    this.#assertNodeIndex(node);
    return this.#terminal[node]! === 1;
  }

  has(pattern: string): boolean {
    if (pattern.length === 0) return false;
    let node = 0;
    for (let i = 0; i < pattern.length; i += 1) {
      const idx = STRIPE_COLORS.indexOf(pattern[i]! as StripeColor);
      if (idx === -1) return false;
      node = this.#children[node * STRIPE_COUNT + idx]!;
      if (node === NO_CHILD) return false;
    }
    return this.#terminal[node]! === 1;
  }
}
