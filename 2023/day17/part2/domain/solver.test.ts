import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '2413432311323',
  '3215453535623',
  '3255245654254',
  '3446585845452',
  '4546657867536',
  '1438598798454',
  '4457876987766',
  '3637877979653',
  '4654967986887',
  '4564679986453',
  '1224686865563',
  '2546548887735',
  '4322674655533',
].join('\n');

const ULTRA_EXAMPLE = [
  '111111111111',
  '999999999991',
  '999999999991',
  '999999999991',
  '999999999991',
].join('\n');

describe('Day 17 Part 2 solver', () => {
  it('solves the official 13x13 example to 94 via executeSolver with a fake Clock', () => {
    let now = 100;
    const fakeClock: Clock = { nowMs: () => (now += 7) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(exec).toEqual({ answer: 94, elapsedMs: 7, runtime: 'main-thread' });
  });

  it('solves the official 5x12 ultra-crucible example to 71', () => {
    expect(solver.solve(solver.parse(ULTRA_EXAMPLE))).toBe(71);
  });

  it('produces bounded and default trace frames ending at 94', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace?.(map, { maxSteps: 10 }) ?? [];
    expect(frames).toHaveLength(10);
    expect(frames[0]!.heatThreshold).toBe(0);
    expect(frames[0]!.settledCount).toBe(1);
    expect(frames[9]!.heatThreshold).toBe(94);
    expect(frames[9]!.isComplete).toBe(true);
    expect(frames[9]!.result.goalHeat).toBe(94);

    const defaults = solver.trace?.(map) ?? [];
    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults[defaults.length - 1]!.heatThreshold).toBe(94);
    expect(defaults[defaults.length - 1]!.isComplete).toBe(true);
  });

  it.each([
    ['2x2', '12\n34'],
    ['1x4', '1234'],
    ['2x6', '123456\n123456'],
    ['1x12', '123456789123'],
  ])('throws unreachable error for %s grid', (_label, raw) => {
    const map = solver.parse(raw);
    expect(() => solver.solve(map)).toThrow(/unreachable/i);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => solver.parse('   \n  \t ')).toThrow(/empty/i);
  });

  it('rejects ragged rows', () => {
    expect(() => solver.parse('123\n12')).toThrow(/width/i);
  });

  it.each(['0', 'a'])('rejects non-1..9 digit %s', (bad) => {
    expect(() => solver.parse(`1${bad}\n12`)).toThrow(/expected '1'\.\.'9'/i);
  });
});
