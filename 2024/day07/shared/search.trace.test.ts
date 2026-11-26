import { describe, expect, it } from 'vitest';
import { CalibrationEquation } from './equation';
import { PART1_OPERATORS } from './operator';
import { SEARCH_NODE_STATUS, traceCalibration, traceEquation } from './search';

describe('traceEquation', () => {
  it('traces k=1 solvable and unsolvable equations without truncation', () => {
    const win = traceEquation(new CalibrationEquation(5n, [5n]), PART1_OPERATORS, 1);
    expect(win.solvable).toBe(true);
    expect(win.truncated).toBe(false);
    expect(win.visitedCount).toBe(1);
    expect(win.prunedCount).toBe(0);
    expect(win.nodes[0]).toMatchObject({ kind: 'visited', status: SEARCH_NODE_STATUS.WINNING });

    const lose = traceEquation(new CalibrationEquation(5n, [4n]), PART1_OPERATORS, 1);
    expect(lose.solvable).toBe(false);
    expect(lose.truncated).toBe(false);
    expect(lose.nodes[0]).toMatchObject({ kind: 'visited', status: SEARCH_NODE_STATUS.BACKTRACKED });
  });

  it('records winning, backtracked, and pruned nodes with prune reasons', () => {
    const eq = new CalibrationEquation(21n, [10n, 1n, 10n]);
    const trace = traceEquation(eq, PART1_OPERATORS);
    expect(trace.solvable).toBe(true);
    expect(trace.truncated).toBe(false);
    expect(eq.evaluateSteps(trace.witness!).at(-1)).toBe(21n);
    expect(trace.naiveCombinations).toBe(4n);

    const statuses = new Set(trace.nodes.map((node) => node.status));
    expect(statuses.has(SEARCH_NODE_STATUS.WINNING)).toBe(true);
    expect(statuses.has(SEARCH_NODE_STATUS.PRUNED)).toBe(true);
    expect(statuses.has(SEARCH_NODE_STATUS.BACKTRACKED)).toBe(true);
    const pruned = trace.nodes.find((n) => n.kind === 'pruned');
    expect(pruned?.pruneReason).toContain('mod');
  });

  it('caps recorded nodes at maxNodes=1 while computing exact counts and witness', () => {
    const solvable = new CalibrationEquation(3267n, [81n, 40n, 27n]);
    const winCap = traceEquation(solvable, PART1_OPERATORS, 1);
    expect(winCap.solvable).toBe(true);
    expect(winCap.truncated).toBe(true);
    expect(winCap.nodes).toHaveLength(1);
    expect(winCap.nodes[0]).toMatchObject({ status: SEARCH_NODE_STATUS.WINNING });
    expect(winCap.visitedCount).toBe(3);

    const unsolvable = new CalibrationEquation(161011n, [16n, 10n, 13n]);
    const loseCap = traceEquation(unsolvable, PART1_OPERATORS, 1);
    expect(loseCap.solvable).toBe(false);
    expect(loseCap.truncated).toBe(true);
    expect(loseCap.nodes).toHaveLength(1);
    expect(loseCap.nodes[0]).toMatchObject({ status: SEARCH_NODE_STATUS.BACKTRACKED });
    expect(loseCap.visitedCount + loseCap.prunedCount).toBeGreaterThan(1);
  });

  it('rejects invalid maxNodes values', () => {
    const eq = new CalibrationEquation(190n, [10n, 19n]);
    expect(() => traceEquation(eq, PART1_OPERATORS, 0)).toThrow(RangeError);
    expect(() => traceEquation(eq, PART1_OPERATORS, -2)).toThrow(RangeError);
    expect(() => traceEquation(eq, PART1_OPERATORS, 1.5)).toThrow(RangeError);
  });
});

describe('traceCalibration', () => {
  it('traces all equations or uniformly samples when maxSteps is smaller', () => {
    const eqs = [
      new CalibrationEquation(190n, [10n, 19n]),
      new CalibrationEquation(83n, [17n, 5n]),
      new CalibrationEquation(3267n, [81n, 40n, 27n]),
      new CalibrationEquation(292n, [11n, 6n, 16n, 20n]),
    ];

    const full = traceCalibration(eqs, PART1_OPERATORS);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full).toHaveLength(4);
    expect(full[3]!.runningTotal).toBe(3749n);
    expect(full[3]!.solvedSoFar).toBe(3);
    expect(full[3]!.unsolvedSoFar).toBe(1);

    const sampled = traceCalibration(eqs, PART1_OPERATORS, { maxSteps: 2, maxTreeNodes: 4 });
    expect(sampled).toHaveLength(2);
    expect(sampled[0]!.equationIndex).toBe(0);
    expect(sampled[1]!.equationIndex).toBe(3);
    expect(sampled[1]!.runningTotal).toBe(3749n);
    expect(sampled[1]!.solvedSoFar).toBe(3);
    expect(sampled[1]!.unsolvedSoFar).toBe(1);
  });

  it('returns empty frozen array for empty equation list and validates options', () => {
    expect(traceCalibration([], PART1_OPERATORS)).toEqual([]);
    const eqs = [new CalibrationEquation(190n, [10n, 19n])];
    expect(() => traceCalibration(eqs, PART1_OPERATORS, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceCalibration(eqs, PART1_OPERATORS, { maxTreeNodes: 0 })).toThrow(RangeError);
  });
});
