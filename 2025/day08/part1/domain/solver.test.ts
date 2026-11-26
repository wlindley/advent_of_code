import { describe, expect, it } from 'vitest';
import { PART1_PAIR_COUNT, connectClosestCircuits, solver, traceCircuitConnections } from './index';

const EXAMPLE = [
  '162,817,812', '57,618,57', '906,360,560', '592,479,940', '352,342,300',
  '466,668,158', '542,29,236', '431,825,988', '739,650,466', '52,470,668',
  '216,146,977', '819,987,18', '117,168,530', '805,96,715', '346,949,466',
  '970,615,88', '941,993,340', '862,61,35', '984,92,344', '425,690,689',
].join('\n');

describe('2025 Day 8 Part 1 solver', () => {
  it('solves the official 20-box example for 10 closest pairs', () => {
    const pts = solver.parse(EXAMPLE);
    const res = connectClosestCircuits(pts, 10);
    expect(res.answer).toBe(40);
    expect(res.componentSizesDesc).toEqual([5, 4, 2, 2, 1, 1, 1, 1, 1, 1, 1]);
    expect(res.steps.filter((s) => s.merged)).toHaveLength(9);
    expect(res.steps.filter((s) => !s.merged)).toHaveLength(1);
  });

  it('consumes pair quota on redundant intra-circuit pairs and handles < 3 circuits & pairCount=0', () => {
    const pts = solver.parse(['0,0,0', '1,0,0', '0,1,0', '100,0,0'].join('\n'));
    const redundant = connectClosestCircuits(pts, 3);
    expect(redundant.steps.map((s) => s.merged)).toEqual([true, true, false]);
    expect(redundant.componentSizesDesc).toEqual([3, 1]);
    expect(redundant.answer).toBe(3);

    const two = solver.parse('0,0,0\n1,0,0');
    expect(connectClosestCircuits(two, 1).answer).toBe(2);
    expect(connectClosestCircuits(pts, 0).steps).toEqual([]);
    expect(connectClosestCircuits(pts, 0).answer).toBe(1);
  });

  it('uses PART1_PAIR_COUNT = 1000 in default solver.solve and solver.trace', () => {
    expect(PART1_PAIR_COUNT).toBe(1000);
    const pts = solver.parse(EXAMPLE);
    expect(solver.solve(pts)).toBe(20);
    const frames = solver.trace!(pts, { maxSteps: 5 });
    expect(frames).toHaveLength(5);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.lastPair).toBeNull();
    expect(frames[4]!.stepIndex).toBe(190);
    expect(frames[4]!.product).toBe(20);
  });

  it('traces with all 5 tier codes (0..4), respects maxSteps bounds, and rejects invalid maxSteps', () => {
    const pts = solver.parse(EXAMPLE);
    const full = traceCircuitConnections(pts, 10);
    expect(full).toHaveLength(11);
    const last = full[10]!;
    expect(last.mergedCount).toBe(9);
    expect(last.redundantCount).toBe(1);
    expect(last.componentCount).toBe(11);
    expect(last.topThreeSizes).toEqual([5, 4, 2]);
    expect(new Set(last.pointTiers)).toEqual(new Set([0, 1, 2, 3, 4]));

    expect(traceCircuitConnections(pts, 0, { maxSteps: 5 })).toHaveLength(1);
    expect(traceCircuitConnections(pts, 10, { maxSteps: 2 }).map((f) => f.stepIndex)).toEqual([0, 10]);
    expect(traceCircuitConnections(pts, 10, { maxSteps: 1 }).map((f) => f.stepIndex)).toEqual([10]);

    for (const bad of [0, -1, 1.5]) {
      expect(() => traceCircuitConnections(pts, 10, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
