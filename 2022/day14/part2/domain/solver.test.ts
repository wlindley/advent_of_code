import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { FLOOR_BOUNDARY_POLICY, solver } from './index';

const EXAMPLE = '498,4 -> 498,6 -> 496,6\n503,4 -> 502,4 -> 502,9 -> 494,9';

class FakeClock implements Clock {
  #tick = 0;

  nowMs(): number {
    this.#tick += 5;
    return this.#tick;
  }
}

describe('2022 day14 part2 solver', () => {
  it('solves the official example to 93 via executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE, new FakeClock());
    expect(execution.answer).toBe(93);
    expect(execution.elapsedMs).toBe(5);
  });

  it('produces bounded trace ending at source in blocked phase', () => {
    const scan = solver.parse(EXAMPLE);
    const frames = solver.trace!(scan, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]).toMatchObject({ settledCount: 0, phase: 'pouring', activeGrain: null });
    const last = frames[frames.length - 1]!;
    expect(last.settledCount).toBe(93);
    expect(last.phase).toBe('blocked');
    expect(last.activeGrain).toMatchObject({ x: 500, y: 0 });
  });

  it('returns 0 with single blocked frame when source is rock', () => {
    const scan = solver.parse('500,0');
    expect(solver.solve(scan)).toBe(0);
    const frames = solver.trace!(scan);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ settledCount: 0, activeGrain: null, phase: 'blocked' });
  });

  it('handles out-of-cone and off-source y=0 rocks', () => {
    expect(solver.solve(solver.parse('1000,0'))).toBe(4);
    expect(solver.solve(solver.parse('499,0'))).toBe(4);
  });

  it('exposes frozen FLOOR_BOUNDARY_POLICY with expected bounds and never escapes', () => {
    expect(Object.isFrozen(FLOOR_BOUNDARY_POLICY)).toBe(true);
    expect(FLOOR_BOUNDARY_POLICY.label).toBe('Bedrock floor');
    const bounds = FLOOR_BOUNDARY_POLICY.computeBounds(solver.parse(EXAMPLE));
    expect(bounds.minX).toBe(489);
    expect(bounds.maxX).toBe(511);
    expect(bounds.maxY).toBe(11);
    expect(bounds.floorY).toBe(11);
    expect(FLOOR_BOUNDARY_POLICY.isEscape(11, bounds)).toBe(false);
  });

  it('rejects empty cave scan input', () => {
    expect(() => solver.parse('   \n  ')).toThrow();
  });

  it('rejects malformed coordinate token', () => {
    expect(() => solver.parse('500,abc')).toThrow();
  });

  it('rejects negative y coordinate', () => {
    expect(() => solver.parse('500,-1')).toThrow();
  });

  it('rejects diagonal rock segment', () => {
    expect(() => solver.parse('500,1 -> 501,2')).toThrow();
  });
});
