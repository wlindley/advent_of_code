import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  SANTA_TRANSFER_POLICY,
  TOTAL_ORBITS_POLICY,
  createTransferPolicy,
} from './policy';
import { OrbitMapSolver } from './solver';

const PART1_EXAMPLE = 'COM)B\nB)C\nC)D\nD)E\nE)F\nB)G\nG)H\nD)I\nE)J\nJ)K\nK)L';
const PART2_EXAMPLE = `${PART1_EXAMPLE}\nK)YOU\nI)SAN`;

describe('orbit policies and OrbitMapSolver', () => {
  it('traces total orbits with depth-sweep frames and caps to maxSteps', () => {
    const solver = new OrbitMapSolver(TOTAL_ORBITS_POLICY);
    expect(solver.policy.id).toBe('total-orbits');
    const map = solver.parse(PART1_EXAMPLE);
    expect(solver.solve(map)).toBe(42);

    const full = solver.trace(map);
    expect(full).toHaveLength(8);
    expect(full[0]).toEqual({
      kind: 'depth-sweep',
      activeDepth: 0,
      totalShells: 8,
      shellNodeCount: 1,
      cumulativeOrbits: 0,
    });
    expect(full[full.length - 1]).toEqual({
      kind: 'depth-sweep',
      activeDepth: 7,
      totalShells: 8,
      shellNodeCount: 1,
      cumulativeOrbits: 42,
    });

    const deepRaw = Array.from({ length: 120 }, (_, i) =>
      `${i === 0 ? 'COM' : `N${i}`})N${i + 1}`,
    ).join('\n');
    const deepMap = solver.parse(deepRaw);
    const defaultCapped = solver.trace(deepMap, {});
    expect(defaultCapped).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(solver.trace(deepMap, { maxSteps: 5 })).toHaveLength(5);
    expect(() => solver.trace(deepMap, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('traces transfer routes with SANTA_TRANSFER_POLICY and createTransferPolicy', () => {
    const solver = new OrbitMapSolver(SANTA_TRANSFER_POLICY);
    expect(solver.policy.id).toBe('transfer:YOU->SAN');
    const map = solver.parse(PART2_EXAMPLE);
    expect(solver.solve(map)).toBe(4);

    const frames = solver.trace(map);
    expect(frames).toHaveLength(5);
    const first = frames[0]!;
    const last = frames[4]!;
    expect(first.kind).toBe('transfer');
    if (first.kind === 'transfer' && last.kind === 'transfer') {
      expect(first.traversedNodeIds).toEqual([map.idOf('K')]);
      expect(last.traversedNodeIds.map((id) => map.labelOf(id))).toEqual(['K', 'J', 'E', 'D', 'I']);
      expect(map.labelOf(last.lcaNodeId)).toBe('D');
    }
    expect(solver.trace(map, { maxSteps: 2 })).toHaveLength(2);
    expect(() => createTransferPolicy('', 'SAN')).toThrow(RangeError);
    expect(() => createTransferPolicy('YOU', '')).toThrow(RangeError);
  });
});
