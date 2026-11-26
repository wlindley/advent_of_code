import { describe, expect, it } from 'vitest';
import { computeCircularSteps, SqrtCircularList } from './circularList';

describe('computeCircularSteps', () => {
  it('returns 0 when ringLength <= 2', () => {
    expect(computeCircularSteps(5n, 1)).toBe(0);
    expect(computeCircularSteps(-99n, 2)).toBe(0);
  });

  it('computes Euclidean modulo (ringLength - 1) for large and negative BigInts', () => {
    expect(computeCircularSteps(0n, 7)).toBe(0);
    expect(computeCircularSteps(6n, 7)).toBe(0);
    expect(computeCircularSteps(-6n, 7)).toBe(0);
    expect(computeCircularSteps(-3n, 7)).toBe(3);
    expect(computeCircularSteps(-2n, 7)).toBe(4);
    expect(computeCircularSteps(811589153n * 4n, 7)).toBe(2);
    expect(computeCircularSteps(-811589153n * 3n, 7)).toBe(3);
  });

  it('rejects non-positive or non-safe-integer ringLength', () => {
    expect(() => computeCircularSteps(1n, 0)).toThrow(RangeError);
    expect(() => computeCircularSteps(1n, -5)).toThrow(RangeError);
    expect(() => computeCircularSteps(1n, 2.5)).toThrow(RangeError);
    expect(() => computeCircularSteps(1n, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('SqrtCircularList', () => {
  it('validates length, blockSize, and element IDs', () => {
    expect(() => new SqrtCircularList(0)).toThrow(RangeError);
    expect(() => new SqrtCircularList(2.5)).toThrow(RangeError);
    expect(() => new SqrtCircularList(5, 0)).toThrow(RangeError);
    expect(() => new SqrtCircularList(5, 1.5)).toThrow(RangeError);

    const ring = new SqrtCircularList(4, 2);
    expect(() => ring.indexOf(-1)).toThrow(RangeError);
    expect(() => ring.indexOf(4)).toThrow(RangeError);
    expect(() => ring.indexOf(1.2)).toThrow(RangeError);
    expect(() => ring.move(4, 1n)).toThrow(RangeError);
  });

  it('keeps order unchanged when steps === 0 (N <= 2 or multiple of N-1)', () => {
    const one = new SqrtCircularList(1);
    expect(one.move(0, 7n)).toEqual({ fromIndex: 0, toIndex: 0, steps: 0 });
    expect(one.toOrder()).toEqual([0]);
    expect(Object.isFrozen(one.toOrder())).toBe(true);

    const two = new SqrtCircularList(2);
    expect(two.move(1, -3n)).toEqual({ fromIndex: 1, toIndex: 1, steps: 0 });
    expect(two.toOrder()).toEqual([0, 1]);

    const five = new SqrtCircularList(5, 2);
    expect(five.move(2, 8n)).toEqual({ fromIndex: 2, toIndex: 2, steps: 0 });
    expect(five.indexOf(2)).toBe(2);
  });

  it('matches official example step-by-step moves and MoveSpan coordinates', () => {
    const deltas = [1n, 2n, -3n, 3n, -2n, 0n, 4n];
    const ring = new SqrtCircularList(deltas.length, 2);

    const spans = deltas.map((delta, id) => ring.move(id, delta));
    expect(spans).toEqual([
      { fromIndex: 0, toIndex: 1, steps: 1 },
      { fromIndex: 0, toIndex: 2, steps: 2 },
      { fromIndex: 1, toIndex: 4, steps: 3 },
      { fromIndex: 2, toIndex: 5, steps: 3 },
      { fromIndex: 2, toIndex: 6, steps: 4 },
      { fromIndex: 3, toIndex: 3, steps: 0 },
      { fromIndex: 5, toIndex: 3, steps: 4 },
    ]);
    expect(ring.toOrder().map((id) => deltas[id])).toEqual([1n, 2n, -3n, 4n, 0n, 3n, -2n]);
  });

  it('handles block emptying and block splitting across multiple blocks', () => {
    const ring = new SqrtCircularList(6, 2);
    // Block 0: [0,1], Block 1: [2,3], Block 2: [4,5]. Move 0 and 1 to end -> drops block 0, splits block 2.
    ring.move(0, 5n); // 0 wraps? 5 % 5 = 0 -> no-op; use 4n then -1n
    ring.move(0, 4n); // moves 0 to index 4 (block 2)
    ring.move(1, 4n); // moves 1 to index 4 (block 0 becomes empty -> dropped, block 2 splits!)
    expect(ring.toOrder()).toEqual([2, 3, 4, 0, 1, 5]);
    for (let id = 0; id < 6; id += 1) {
      expect(ring.indexOf(id)).toBe(ring.toOrder().indexOf(id));
    }
    // Now move an element into an early block repeatedly to trigger split on block 0 with trailing blocks.
    ring.move(5, -4n);
    ring.move(1, -4n);
    ring.move(0, -4n);
    const order = ring.toOrder();
    expect(order).toHaveLength(6);
    for (let id = 0; id < 6; id += 1) {
      expect(ring.indexOf(id)).toBe(order.indexOf(id));
    }
  });
});
