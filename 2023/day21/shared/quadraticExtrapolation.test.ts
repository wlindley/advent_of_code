import { describe, expect, it } from 'vitest';
import { QuadraticProgression } from './quadraticExtrapolation';

describe('QuadraticProgression', () => {
  it('computes dynamic first and second differences and freezes instance', () => {
    const q = new QuadraticProgression(3n, 10n, 21n);
    expect(Object.isFrozen(q)).toBe(true);
    expect(q.y0).toBe(3n);
    expect(q.y1).toBe(10n);
    expect(q.y2).toBe(21n);
    expect(q.firstDifference).toBe(7n);
    expect(q.secondDifference).toBe(4n);
  });

  it('evaluates quadratic terms via Newton forward differences and checks samples', () => {
    // f(k) = 2k^2 + 5k + 3 => f(0)=3, f(1)=10, f(2)=21, f(3)=36, f(4)=55
    const q = new QuadraticProgression(3n, 10n, 21n);
    expect(q.evaluate(0n)).toBe(3n);
    expect(q.evaluate(1n)).toBe(10n);
    expect(q.evaluate(2n)).toBe(21n);
    expect(q.evaluate(3n)).toBe(36n);
    expect(q.evaluate(1000n)).toBe(2_005_003n);
    expect(q.matchesSample(4n, 55n)).toBe(true);
    expect(q.matchesSample(4n, 54n)).toBe(false);
  });

  it('rejects negative evaluation index k', () => {
    const q = new QuadraticProgression(1n, 4n, 9n);
    expect(() => q.evaluate(-1n)).toThrow(RangeError);
    expect(() => q.matchesSample(-1n, 0n)).toThrow(RangeError);
  });
});
