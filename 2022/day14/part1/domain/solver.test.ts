import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { parseCaveScan, simulateReservoir } from '../../shared';
import { ABYSS_BOUNDARY_POLICY, solver } from './index';

const EXAMPLE = '498,4 -> 498,6 -> 496,6\n503,4 -> 502,4 -> 502,9 -> 494,9';

describe('2022 day14 part1 solver', () => {
  it('solves the official example to 24 via executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE);
    expect(execution.answer).toBe(24);
    expect(ABYSS_BOUNDARY_POLICY.label).toBe('Abyss');
  });

  it('produces bounded trace ending in escaped phase', () => {
    const scan = solver.parse(EXAMPLE);
    const frames = solver.trace!(scan, { maxSteps: 8 });
    expect(frames).toHaveLength(8);
    expect(frames[0]!.settledCount).toBe(0);
    expect(frames[7]!.settledCount).toBe(24);
    expect(frames[7]!.phase).toBe('escaped');
  });

  it('clamps abyss bounds cone when rocks extend far past maxY', () => {
    const scan = parseCaveScan('100,2 -> 900,2');
    const field = simulateReservoir(scan, ABYSS_BOUNDARY_POLICY);
    expect(field.bounds.minX).toBe(497);
    expect(field.bounds.maxX).toBe(503);
    expect(field.bounds.maxY).toBe(3);
  });
});
