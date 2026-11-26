import { describe, expect, it } from 'vitest';
import { XmasStream } from './stream';
import {
  collectPreambleChecks,
  findFirstInvalidStep,
  iterateWindowChecks,
  SumPairMatch,
  validatePreambleLength,
  WindowCheckStep,
} from './window';

const OFFICIAL_W5 = new XmasStream([
  35n, 20n, 15n, 25n, 47n, 40n, 62n, 55n, 65n, 95n,
  102n, 117n, 150n, 182n, 127n, 219n, 299n, 277n, 309n, 576n,
]);

const MANIFEST_W25 = new XmasStream([
  ...Array.from({ length: 25 }, (_, i) => BigInt(i + 1)),
  45n, 26n, 64n, 66n, 125n, 111n,
]);

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

function bruteForceFindFirstInvalid(values: readonly bigint[], w: number): number | null {
  for (let t = w; t < values.length; t += 1) {
    const target = values[t]!;
    let found = false;
    for (let i = t - w; i < t && !found; i += 1) {
      for (let j = i + 1; j < t; j += 1) {
        if (values[i]! !== values[j]! && values[i]! + values[j]! === target) {
          found = true;
          break;
        }
      }
    }
    if (!found) return t;
  }
  return null;
}

describe('window validation and value objects', () => {
  it('validates preamble length >= 2 integer', () => {
    expect(() => validatePreambleLength(2)).not.toThrow();
    expect(() => validatePreambleLength(1)).toThrow(RangeError);
    expect(() => validatePreambleLength(2.5)).toThrow(RangeError);
    expect(() => validatePreambleLength(Number.NaN)).toThrow(RangeError);
  });

  it('enforces SumPairMatch and WindowCheckStep invariants and freezes instances', () => {
    const pair = new SumPairMatch(1, 3);
    expect(Object.isFrozen(pair)).toBe(true);
    expect(() => new SumPairMatch(-1, 2)).toThrow(RangeError);
    expect(() => new SumPairMatch(2, 2)).toThrow(RangeError);
    expect(() => new SumPairMatch(1.5, 2)).toThrow(RangeError);

    const step = new WindowCheckStep(5, 1, pair);
    expect(Object.isFrozen(step)).toBe(true);
    expect(step.isValid).toBe(true);
    expect(step.windowLength).toBe(4);
    expect(new WindowCheckStep(5, 1, null).isValid).toBe(false);

    expect(() => new WindowCheckStep(2, 2, null)).toThrow(RangeError);
    expect(() => new WindowCheckStep(2, -1, null)).toThrow(RangeError);
    expect(() => new WindowCheckStep(5, 2, new SumPairMatch(1, 3))).toThrow(RangeError);
    expect(() => new WindowCheckStep(5, 1, new SumPairMatch(2, 5))).toThrow(RangeError);
  });
});

describe('sliding window XMAS checks', () => {
  it('solves official W=5 and manifest W=25 examples', () => {
    const w5 = findFirstInvalidStep(OFFICIAL_W5, 5);
    expect(w5.targetIndex).toBe(14);
    expect(OFFICIAL_W5.at(w5.targetIndex)).toBe(127n);

    const w25 = findFirstInvalidStep(MANIFEST_W25, 25);
    expect(w25.targetIndex).toBe(29);
    expect(MANIFEST_W25.at(w25.targetIndex)).toBe(125n);
  });

  it('enforces distinct values and retains duplicate indices on eviction', () => {
    const samePair = new XmasStream([5n, 5n, 10n]);
    expect(findFirstInvalidStep(samePair, 2).targetIndex).toBe(2);

    const distinctAfterDups = new XmasStream([5n, 5n, 3n, 7n, 10n]);
    const checks = collectPreambleChecks(distinctAfterDups, 4);
    expect(checks).toHaveLength(1);
    expect(checks[0]!.pairMatch).toEqual(new SumPairMatch(2, 3));

    const dupEvict = new XmasStream([5n, 5n, 2n, 7n, 12n]);
    const evictChecks = collectPreambleChecks(dupEvict, 3);
    expect(evictChecks.every((c) => c.isValid)).toBe(true);
    expect(evictChecks[1]!.pairMatch).toEqual(new SumPairMatch(1, 3));
  });

  it('throws on all-valid or undersized streams and yields full iteration', () => {
    const allValid = new XmasStream([1n, 2n, 3n, 5n]);
    expect(() => findFirstInvalidStep(allValid, 2)).toThrow('No invalid number found');
    expect([...iterateWindowChecks(allValid, 2)]).toHaveLength(2);
    expect(collectPreambleChecks(allValid, 2)).toHaveLength(2);

    expect(() => collectPreambleChecks(new XmasStream([1n, 2n]), 2)).toThrow(RangeError);
    expect(() => findFirstInvalidStep(new XmasStream([1n, 2n]), 3)).toThrow(RangeError);
  });

  it('matches independent O(W^2) brute-force oracle across 50 seeded cases including > 2^53 BigInts', () => {
    const nextRand = makePrng(20200901);
    const bigOffset = 1n << 58n;
    for (let c = 0; c < 50; c += 1) {
      const w = 2 + (nextRand() % 8);
      const len = w + 1 + (nextRand() % 20);
      const values: bigint[] = [];
      for (let i = 0; i < w; i += 1) {
        values.push(bigOffset + BigInt(1 + (nextRand() % 10)));
      }
      for (let i = w; i < len; i += 1) {
        if (nextRand() % 4 === 0) {
          values.push(bigOffset * 2n + BigInt(2 + (nextRand() % 25)));
        } else {
          const a = values[i - 1 - (nextRand() % w)]!;
          const b = values[i - 1 - (nextRand() % w)]!;
          values.push(a + b);
        }
      }
      const stream = new XmasStream(values);
      const expectedIndex = bruteForceFindFirstInvalid(values, w);
      if (expectedIndex === null) {
        expect(() => findFirstInvalidStep(stream, w)).toThrow('No invalid number found');
      } else {
        const step = findFirstInvalidStep(stream, w);
        expect(step.targetIndex).toBe(expectedIndex);
      }
    }
  });
});
