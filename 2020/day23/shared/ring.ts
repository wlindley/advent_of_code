import type { CupRingSpec } from './model';

export interface CupMoveRecord {
  readonly sourceCup: number;
  readonly pickedUp: readonly [number, number, number];
  readonly destination: number;
  readonly nextCurrent: number;
}

function assertCupIndex(cup: number, maxCup: number, label: string): void {
  if (!Number.isInteger(cup) || cup < 1 || cup > maxCup) {
    throw new RangeError(`${label} must be an integer in [1, ${maxCup}], got ${cup}`);
  }
}

/** Int32Array-backed circular linked cup ring with O(1) per-move splice transitions. */
export class CupRing {
  private readonly next: Int32Array;
  private cur: number;
  readonly cupCount: number;

  constructor(spec: CupRingSpec, totalCups: number) {
    if (!Number.isInteger(totalCups) || totalCups < spec.count) {
      throw new RangeError(`totalCups must be an integer >= ${spec.count}, got ${totalCups}`);
    }
    this.cupCount = totalCups;
    const next = new Int32Array(totalCups + 1);
    const labels = spec.labels;
    for (let i = 0; i < labels.length - 1; i += 1) {
      next[labels[i]!] = labels[i + 1]!;
    }
    const lastSpec = labels[labels.length - 1]!;
    if (totalCups > labels.length) {
      next[lastSpec] = labels.length + 1;
      for (let cup = labels.length + 1; cup < totalCups; cup += 1) {
        next[cup] = cup + 1;
      }
      next[totalCups] = spec.firstCup;
    } else {
      next[lastSpec] = spec.firstCup;
    }
    this.next = next;
    this.cur = spec.firstCup;
  }

  get currentCup(): number {
    return this.cur;
  }

  nextOf(cup: number): number {
    assertCupIndex(cup, this.cupCount, 'cup');
    return this.next[cup]!;
  }

  advance(moves: number): CupMoveRecord {
    if (!Number.isInteger(moves) || moves < 1) {
      throw new RangeError(`moves must be a positive integer, got ${moves}`);
    }
    const next = this.next;
    const maxCup = this.cupCount;
    let cur = this.cur;
    let source = 0, p1 = 0, p2 = 0, p3 = 0, dest = 0;
    for (let m = 0; m < moves; m += 1) {
      source = cur;
      p1 = next[cur]!;
      p2 = next[p1]!;
      p3 = next[p2]!;
      dest = cur > 1 ? cur - 1 : maxCup;
      while (dest === p1 || dest === p2 || dest === p3) {
        dest = dest > 1 ? dest - 1 : maxCup;
      }
      // Why: next[cur] = next[p3] MUST precede next[p3] = next[dest] so dest === cur (N = 4) works identically.
      next[cur] = next[p3]!;
      next[p3] = next[dest]!;
      next[dest] = p1;
      cur = next[cur]!;
    }
    this.cur = cur;
    return Object.freeze({
      sourceCup: source,
      pickedUp: Object.freeze([p1, p2, p3] as const),
      destination: dest,
      nextCurrent: cur,
    });
  }

  clockwiseFrom(startCup: number, count: number): readonly number[] {
    assertCupIndex(startCup, this.cupCount, 'startCup');
    if (!Number.isInteger(count) || count < 0 || count > this.cupCount) {
      throw new RangeError(`count must be an integer in [0, ${this.cupCount}], got ${count}`);
    }
    const result: number[] = [];
    let cursor = startCup;
    for (let i = 0; i < count; i += 1) {
      result.push(cursor);
      cursor = this.next[cursor]!;
    }
    return Object.freeze(result);
  }

  labelsAfterOne(): string {
    return this.clockwiseFrom(1, this.cupCount).slice(1).join('');
  }

  productAfterOne(): bigint {
    const first = this.next[1]!;
    const second = this.next[first]!;
    return BigInt(first) * BigInt(second);
  }
}
