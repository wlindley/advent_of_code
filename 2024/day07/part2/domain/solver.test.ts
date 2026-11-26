import { describe, expect, it } from 'vitest';
import {
  CalibrationEquation,
  SEARCH_NODE_STATUS,
  solveEquation,
  type PrunedSearchNode,
} from '../../shared';
import { CONCAT_OPERATOR, PART2_OPERATORS, solvePart2, solver, tracePart2 } from './index';

const EXAMPLE = [
  '190: 10 19',
  '3267: 81 40 27',
  '83: 17 5',
  '156: 15 6',
  '7290: 6 8 6 15',
  '161011: 16 10 13',
  '192: 17 8 14',
  '21037: 9 7 18 13',
  '292: 11 6 16 20',
].join('\n');

describe('Part 2 Bridge Repair solver', () => {
  it('solves the official 9-equation example to 11387n with verified witnesses', () => {
    const eqs = solver.parse(EXAMPLE);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.solve(eqs)).toBe(11387n);
    expect(solvePart2(eqs)).toBe(11387n);

    const status = eqs.map((eq) => solveEquation(eq, PART2_OPERATORS) !== null);
    expect(status).toEqual([true, true, false, true, true, false, true, false, true]);

    for (const idx of [3, 4, 6]) {
      const eq = eqs[idx]!;
      const witness = solveEquation(eq, PART2_OPERATORS)!;
      const steps = eq.evaluateSteps(witness);
      expect(steps[steps.length - 1]).toBe(eq.target);
    }
  });

  it('produces unsampled and sampled traces with accurate Part 2 counters', () => {
    const eqs = solver.parse(EXAMPLE);
    const full = solver.trace!(eqs);
    expect(full).toHaveLength(9);
    const last = full[full.length - 1]!;
    expect(last.runningTotal).toBe(11387n);
    expect(last.solvedSoFar).toBe(6);
    expect(last.unsolvedSoFar).toBe(3);
    expect(last.trace.operatorCount).toBe(3);

    const sampled = tracePart2(eqs, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[2]!.runningTotal).toBe(11387n);
  });

  it('caps recorded tree nodes and records pruned concat reasons', () => {
    const eqs = solver.parse('161011: 16 10 13\n15: 2 15\n105: 9 15');
    const capped = tracePart2(eqs, { maxTreeNodes: 4 });
    expect(capped[0]!.trace.truncated).toBe(true);
    expect(capped[0]!.trace.nodes).toHaveLength(4);

    const concatPruned = capped[1]!.trace.nodes.filter(
      (n): n is PrunedSearchNode =>
        n.status === SEARCH_NODE_STATUS.PRUNED && n.operator === CONCAT_OPERATOR,
    );
    expect(concatPruned.map((n) => n.pruneReason)).toContain('15 <= 15');

    const suffixPruned = capped[2]!.trace.nodes.filter(
      (n): n is PrunedSearchNode =>
        n.status === SEARCH_NODE_STATUS.PRUNED && n.operator === CONCAT_OPERATOR,
    );
    expect(suffixPruned.map((n) => n.pruneReason)).toContain('105 !ends 15');
  });

  it('handles k=1, left-to-right non-associativity, zero traps, power-of-10, and >2^64 BigInt', () => {
    expect(solvePart2(solver.parse('42: 42\n42: 43'))).toBe(42n);
    expect(solvePart2(solver.parse('192: 17 8 14\n1722: 17 8 14'))).toBe(192n);
    expect(solvePart2(solver.parse('15: 2 15\n10: 10 10\n15: 7 5 15'))).toBe(0n);
    expect(solvePart2(solver.parse('1010: 10 10\n1000: 1 100\n1001: 100 1'))).toBe(2011n);

    const big = (1n << 64n) + 7n;
    const bigTarget = BigInt(`${big}99`);
    expect(solvePart2([new CalibrationEquation(bigTarget, [big, 99n])])).toBe(bigTarget);
  });

  it('rejects invalid input formats at the parser boundary', () => {
    expect(() => solver.parse('')).toThrow(/no equations/i);
    expect(() => solver.parse('123 45 6')).toThrow(/delimiter/i);
    expect(() => solver.parse('0: 1 2')).toThrow(RangeError);
    expect(() => solver.parse('10: 0 2')).toThrow(RangeError);
  });
});
