import { describe, expect, it } from 'vitest';
import {
  AdapterArraySolver,
  ARRANGEMENT_COUNT_POLICY,
  JOLTAGE_DIFF_PRODUCT_POLICY,
} from './index';

const SMALL_RAW = ['16', '10', '15', '5', '1', '11', '7', '19', '6', '12', '4'].join('\n');

describe('AdapterArraySolver & policies', () => {
  it('solves and traces Part 1 difference product with omitted, empty, and bounded options', () => {
    const solver = new AdapterArraySolver(JOLTAGE_DIFF_PRODUCT_POLICY);
    expect(solver.policy).toBe(JOLTAGE_DIFF_PRODUCT_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);

    const chain = solver.parse(SMALL_RAW);
    expect(solver.solve(chain)).toBe(35n);

    const full = solver.trace(chain);
    const emptyOpts = solver.trace(chain, {});
    const capped = solver.trace(chain, { maxSteps: 5 });
    expect(full).toHaveLength(12);
    expect(emptyOpts).toHaveLength(12);
    expect(capped).toHaveLength(5);
    expect(capped[4]!.isComplete).toBe(true);
    expect(() => solver.trace(chain, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('solves and traces Part 2 arrangement counts cleanly', () => {
    const solver = new AdapterArraySolver(ARRANGEMENT_COUNT_POLICY);
    expect(solver.policy.id).toBe('arrangement-count');
    const chain = solver.parse(SMALL_RAW);
    expect(solver.solve(chain)).toBe(8n);
    const frames = solver.trace(chain, { maxSteps: 4 });
    expect(frames).toHaveLength(4);
    expect(frames[3]!.phase).toBe('arrangements');
    expect(frames[3]!.isComplete).toBe(true);
  });
});
