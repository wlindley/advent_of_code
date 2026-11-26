import { DirectedGraph } from '../../../shared/core';

/** Validates that a page identifier is a positive safe integer. */
export function assertPageNumber(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

function assertIndex(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

function filterTargets(unique: readonly number[], targets: ReadonlySet<number> | undefined): number[] {
  if (!targets) return [];
  const out: number[] = [];
  for (const after of unique) {
    if (targets.has(after)) out.push(after);
  }
  return out;
}

/** Immutable directed precedence constraint requiring `before` to appear prior to `after`. */
export class PageOrderRule {
  readonly before: number;
  readonly after: number;

  constructor(before: number, after: number) {
    assertPageNumber(before, 'before');
    assertPageNumber(after, 'after');
    if (before === after) throw new RangeError(`Rule cannot relate page ${before} to itself`);
    this.before = before;
    this.after = after;
    Object.freeze(this);
  }
}

/** Precedence rule instantiated against concrete zero-based positions in an update. */
export class ApplicableRule {
  readonly before: number;
  readonly after: number;
  readonly beforeIndex: number;
  readonly afterIndex: number;

  constructor(before: number, after: number, beforeIndex: number, afterIndex: number) {
    assertPageNumber(before, 'before');
    assertPageNumber(after, 'after');
    if (before === after) throw new RangeError(`Rule cannot relate page ${before} to itself`);
    assertIndex(beforeIndex, 'beforeIndex');
    assertIndex(afterIndex, 'afterIndex');
    if (beforeIndex === afterIndex) {
      throw new RangeError(`beforeIndex and afterIndex must differ, got ${beforeIndex}`);
    }
    this.before = before;
    this.after = after;
    this.beforeIndex = beforeIndex;
    this.afterIndex = afterIndex;
    Object.freeze(this);
  }

  get isSatisfied(): boolean {
    return this.beforeIndex < this.afterIndex;
  }
}

/** Deduplicated set of pairwise page-ordering constraints. */
export class PageOrderRules {
  private readonly afterByBefore: ReadonlyMap<number, ReadonlySet<number>>;

  constructor(rules: Iterable<PageOrderRule>) {
    const map = new Map<number, Set<number>>();
    for (const rule of rules) {
      let targets = map.get(rule.before);
      if (!targets) {
        targets = new Set<number>();
        map.set(rule.before, targets);
      }
      targets.add(rule.after);
    }
    this.afterByBefore = map;
    Object.freeze(this);
  }

  get ruleCount(): number {
    let total = 0;
    for (const targets of this.afterByBefore.values()) total += targets.size;
    return total;
  }

  mustPrecede(before: number, after: number): boolean {
    return this.afterByBefore.get(before)?.has(after) ?? false;
  }

  isValidOrder(pages: readonly number[]): boolean {
    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        if (this.mustPrecede(pages[j]!, pages[i]!)) return false;
      }
    }
    return true;
  }

  applicableRules(pages: readonly number[]): readonly ApplicableRule[] {
    const result: ApplicableRule[] = [];
    for (let i = 0; i < pages.length; i++) {
      const a = pages[i]!;
      for (let j = i + 1; j < pages.length; j++) {
        const b = pages[j]!;
        if (this.mustPrecede(a, b)) result.push(new ApplicableRule(a, b, i, j));
        if (this.mustPrecede(b, a)) result.push(new ApplicableRule(b, a, j, i));
      }
    }
    return Object.freeze(result);
  }

  inducedGraph(pages: readonly number[]): DirectedGraph<number> {
    const unique = [...new Set(pages)];
    const entries: [number, number[]][] = [];
    for (const before of unique) {
      entries.push([before, filterTargets(unique, this.afterByBefore.get(before))]);
    }
    return new DirectedGraph<number>(entries);
  }
}
