import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { CpuProgram, CpuTimeline, DEFAULT_MAX_TRACE_STEPS } from '../../shared';
import { STANDARD_PROBE_CYCLES, solver, sumSignalStrengths } from './index';

const OFFICIAL_EXAMPLE = [
  'addx 15', 'addx -11', 'addx 6', 'addx -3', 'addx 5', 'addx -1', 'addx -8', 'addx 13',
  'addx 4', 'noop', 'addx -1', 'addx 5', 'addx -1', 'addx 5', 'addx -1', 'addx 5',
  'addx -1', 'addx 5', 'addx -1', 'addx -35', 'addx 1', 'addx 24', 'addx -19', 'addx 1',
  'addx 16', 'addx -11', 'noop', 'noop', 'addx 21', 'addx -15', 'noop', 'noop',
  'addx -3', 'addx 9', 'addx 1', 'addx -3', 'addx 8', 'addx 1', 'addx 5', 'noop',
  'noop', 'noop', 'noop', 'noop', 'addx -36', 'noop', 'addx 1', 'addx 7',
  'noop', 'noop', 'noop', 'addx 2', 'addx 6', 'noop', 'noop', 'noop',
  'noop', 'noop', 'addx 1', 'noop', 'noop', 'addx 7', 'addx 1', 'noop',
  'addx -13', 'addx 13', 'addx 7', 'noop', 'addx 1', 'addx -33', 'noop', 'noop',
  'noop', 'addx 2', 'noop', 'noop', 'noop', 'addx 8', 'noop', 'addx -1',
  'addx 2', 'addx 1', 'noop', 'addx 17', 'addx -9', 'addx 1', 'addx 1', 'addx -3',
  'addx 11', 'noop', 'noop', 'addx 1', 'noop', 'addx 1', 'noop', 'noop',
  'addx -13', 'addx -19', 'addx 1', 'addx 3', 'addx 26', 'addx -30', 'addx 12', 'addx -1',
  'addx 3', 'addx 1', 'noop', 'noop', 'noop', 'addx -9', 'addx 18', 'addx 1',
  'addx 2', 'noop', 'noop', 'addx 9', 'noop', 'noop', 'noop', 'addx -1',
  'addx 2', 'addx -37', 'addx 1', 'addx 3', 'noop', 'addx 15', 'addx -21', 'addx 22',
  'addx -6', 'addx 1', 'noop', 'addx 2', 'addx 1', 'noop', 'addx -10', 'noop',
  'noop', 'addx 20', 'addx 1', 'addx 2', 'addx 2', 'addx -6', 'addx -11', 'noop',
  'noop', 'noop',
].join('\n');

describe('Day 10 Part 1 solver', () => {
  it('solves the small 3-instruction example as 0 (fewer than 20 cycles)', () => {
    const program = solver.parse('noop\naddx 3\naddx -5');
    expect(solver.solve(program)).toBe(0);
  });

  it('solves the official 146-instruction example to 13140 via executeSolver', () => {
    let tick = 10;
    const fakeClock: Clock = {
      nowMs: () => {
        tick += 5;
        return tick;
      },
    };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result.answer).toBe(13140);
    expect(result.elapsedMs).toBe(5);
    expect(result.runtime).toBe('main-thread');
  });

  it('emits bounded 240-frame default trace and custom subsampled traces', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE);
    expect(program.totalCycles).toBe(240);

    const full = solver.trace!(program);
    expect(full).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(full[19]!.cycle).toBe(20);
    expect(full[19]!.isProbeCycle).toBe(true);
    expect(full[19]!.cumulativeSignalStrength).toBe(420);
    expect(full[239]!.isComplete).toBe(true);
    expect(full[239]!.cumulativeSignalStrength).toBe(13140);

    const sampled = solver.trace!(program, { maxSteps: 12 });
    expect(sampled).toHaveLength(12);
    expect(sampled[0]!.cycle).toBe(1);
    expect(sampled[11]!.cycle).toBe(240);
    expect(sampled[11]!.cumulativeSignalStrength).toBe(13140);
  });

  it('supports custom probeCycles and guards against safe-integer sum overflow', () => {
    expect(STANDARD_PROBE_CYCLES).toEqual([20, 60, 100, 140, 180, 220]);
    const timeline = CpuTimeline.execute(CpuProgram.parse('noop\naddx 3\naddx -5'));
    expect(sumSignalStrengths(timeline, [2, 5])).toBe(2 * 1 + 5 * 4);

    const targetX = Math.floor(Number.MAX_SAFE_INTEGER / 4);
    const hugeTimeline = CpuTimeline.execute(
      CpuProgram.parse(`addx ${targetX - 1}\nnoop\nnoop`),
    );
    expect(() => sumSignalStrengths(hugeTimeline, [3, 4])).toThrow(RangeError);
  });

  it('propagates parse errors cleanly', () => {
    expect(() => solver.parse('')).toThrow(/empty/i);
    expect(() => solver.parse('addx 01')).toThrow(/invalid instruction/i);
  });
});
