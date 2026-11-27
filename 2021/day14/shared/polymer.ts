import {
  addPairCount,
  compareFrequency,
  compareReaction,
  ELEMENT_RE,
  InsertionRule,
  PAIR_RE,
  validateStepCount,
  type ElementFrequency,
  type PairReaction,
} from './rules';

export { InsertionRule, validateStepCount, type ElementFrequency, type PairReaction };

const TEMPLATE_RE = /^[A-Z]+$/;

/** Immutable polymer template and unique pair-insertion rule table. */
export class PolymerFormula {
  readonly template: string;
  private readonly ruleMap: ReadonlyMap<string, InsertionRule>;

  constructor(template: string, rules: readonly InsertionRule[]) {
    if (!TEMPLATE_RE.test(template)) {
      throw new RangeError(`Polymer template must match /^[A-Z]+$/, got "${template}"`);
    }
    const map = new Map<string, InsertionRule>();
    for (const rule of rules) {
      if (map.has(rule.pair)) {
        throw new RangeError(`Duplicate insertion rule for pair "${rule.pair}"`);
      }
      map.set(rule.pair, rule);
    }
    this.template = template;
    this.ruleMap = map;
    Object.freeze(this);
  }

  get rules(): readonly InsertionRule[] {
    return Object.freeze(Array.from(this.ruleMap.values()));
  }

  get ruleCount(): number {
    return this.ruleMap.size;
  }

  get lastElement(): string {
    return this.template.slice(-1);
  }

  ruleFor(pair: string): InsertionRule | undefined {
    return this.ruleMap.get(pair);
  }

  initialState(): PolymerState {
    const pairs = new Map<string, bigint>();
    for (let i = 0; i <= this.template.length - 2; i += 1) {
      addPairCount(pairs, this.template.slice(i, i + 2), 1n);
    }
    return new PolymerState(pairs, this.lastElement);
  }
}

/** Immutable adjacent-pair frequency representation of a polymer chain. */
export class PolymerState {
  private readonly pairs: ReadonlyMap<string, bigint>;
  readonly lastElement: string;

  constructor(pairs: ReadonlyMap<string, bigint>, lastElement: string) {
    if (!ELEMENT_RE.test(lastElement)) {
      throw new RangeError(`lastElement must match /^[A-Z]$/, got "${lastElement}"`);
    }
    const normalized = new Map<string, bigint>();
    for (const [pair, count] of pairs) {
      if (!PAIR_RE.test(pair)) {
        throw new RangeError(`Invalid pair key "${pair}"`);
      }
      if (count < 0n) {
        throw new RangeError(`Pair count for "${pair}" must be non-negative, got ${count}`);
      }
      if (count > 0n) {
        normalized.set(pair, count);
      }
    }
    this.pairs = normalized;
    this.lastElement = lastElement;
    Object.freeze(this);
  }

  get pairCounts(): ReadonlyMap<string, bigint> {
    return new Map(this.pairs);
  }

  get activePairCount(): number {
    return this.pairs.size;
  }

  get totalLength(): bigint {
    let total = 1n;
    for (const count of this.pairs.values()) {
      total += count;
    }
    return total;
  }

  countOfPair(pair: string): bigint {
    return this.pairs.get(pair) ?? 0n;
  }

  private computeCountsWithAnchor(): Map<string, bigint> {
    const counts = new Map<string, bigint>();
    let anchorCount = 1n;
    counts.set(this.lastElement, anchorCount);
    for (const [pair, count] of this.pairs) {
      const left = pair.slice(0, 1);
      if (left === this.lastElement) {
        anchorCount += count;
        counts.set(left, anchorCount);
      } else {
        addPairCount(counts, left, count);
      }
    }
    return counts;
  }

  get elementFrequencies(): readonly ElementFrequency[] {
    const entries: ElementFrequency[] = [];
    for (const [element, count] of this.computeCountsWithAnchor()) {
      entries.push(Object.freeze({ element, count }));
    }
    entries.sort(compareFrequency);
    return Object.freeze(entries);
  }

  get mostCommon(): ElementFrequency {
    return this.elementFrequencies[0]!;
  }

  get leastCommon(): ElementFrequency {
    const freqs = this.elementFrequencies;
    return freqs[freqs.length - 1]!;
  }

  get spread(): bigint {
    const freqs = this.elementFrequencies;
    return freqs[0]!.count - freqs[freqs.length - 1]!.count;
  }

  activeReactions(formula: PolymerFormula): readonly PairReaction[] {
    const reactions: PairReaction[] = [];
    for (const [pair, count] of this.pairs) {
      const rule = formula.ruleFor(pair);
      if (rule !== undefined) {
        reactions.push(Object.freeze({ pair, insert: rule.insert, count }));
      }
    }
    reactions.sort(compareReaction);
    return Object.freeze(reactions);
  }

  insertionsNext(formula: PolymerFormula): bigint {
    let total = 0n;
    for (const [pair, count] of this.pairs) {
      if (formula.ruleFor(pair) !== undefined) {
        total += count;
      }
    }
    return total;
  }

  step(formula: PolymerFormula): PolymerState {
    const next = new Map<string, bigint>();
    for (const [pair, count] of this.pairs) {
      const rule = formula.ruleFor(pair);
      if (rule === undefined) {
        addPairCount(next, pair, count);
      } else {
        addPairCount(next, rule.leftProduct, count);
        addPairCount(next, rule.rightProduct, count);
      }
    }
    return new PolymerState(next, this.lastElement);
  }

  advance(formula: PolymerFormula, steps: number): PolymerState {
    const count = validateStepCount(steps);
    let current: PolymerState = this;
    for (let i = 0; i < count; i += 1) {
      current = current.step(formula);
    }
    return current;
  }
}
