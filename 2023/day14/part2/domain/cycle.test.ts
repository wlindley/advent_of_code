import { describe, expect, it } from 'vitest';
import { parseDishPlatform } from '../../shared';
import {
  analyzeSpinCycles,
  DEFAULT_TARGET_CYCLES,
  SpinCycleAnalysis,
  spinOnce,
} from './cycle';

const EXAMPLE = [
  'O....#....',
  'O.OO#....#',
  '.....##...',
  'OO.#O....O',
  '.O.....O#.',
  'O.#..O.#.#',
  '..O..#O..O',
  '.......O..',
  '#....###..',
  '#OO..#....',
].join('\n');

const CYCLE_1 = [
  '.....#....',
  '....#...O#',
  '...OO##...',
  '.OO#......',
  '.....OOO#.',
  '.O#...O#.#',
  '....O#....',
  '......OOOO',
  '#...O###..',
  '#..OO#....',
].join('\n');

const CYCLE_2 = [
  '.....#....',
  '....#...O#',
  '.....##...',
  '..O#......',
  '.....OOO#.',
  '.O#...O#.#',
  '....O#...O',
  '.......OOO',
  '#..OO###..',
  '#.OOO#...O',
].join('\n');

const CYCLE_3 = [
  '.....#....',
  '....#...O#',
  '.....##...',
  '..O#......',
  '.....OOO#.',
  '.O#...O#.#',
  '....O#...O',
  '.......OOO',
  '#...O###.O',
  '#.OOO#...O',
].join('\n');

describe('2023/day14/part2/domain/cycle', () => {
  it('spins the official example through cycles 1, 2, and 3 with exact grids and loads', () => {
    const p0 = parseDishPlatform(EXAMPLE);
    const p1 = spinOnce(p0);
    const p2 = spinOnce(p1);
    const p3 = spinOnce(p2);

    expect(p1.toLines().join('\n')).toBe(CYCLE_1);
    expect(p1.northLoad).toBe(87);
    expect(p2.toLines().join('\n')).toBe(CYCLE_2);
    expect(p2.northLoad).toBe(69);
    expect(p3.toLines().join('\n')).toBe(CYCLE_3);
    expect(p3.northLoad).toBe(69);
  });

  it('detects the official example cycle and projects 1_000_000_000 to 64', () => {
    const initial = parseDishPlatform(EXAMPLE);
    const analysis = analyzeSpinCycles(initial);

    expect(DEFAULT_TARGET_CYCLES).toBe(1_000_000_000);
    expect(analysis).toBeInstanceOf(SpinCycleAnalysis);
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(Object.isFrozen(analysis.history)).toBe(true);
    expect(Object.isFrozen(analysis.loadSeries)).toBe(true);
    expect(analysis.targetCycles).toBe(1_000_000_000);
    expect(analysis.cycleStart).toBe(3);
    expect(analysis.repeatCycle).toBe(10);
    expect(analysis.cycleLength).toBe(7);
    expect(analysis.equivalentCycle).toBe(6);
    expect(analysis.finalLoad).toBe(64);
    expect(analysis.finalPlatform.fingerprint()).toBe(analysis.history[6]!.fingerprint());
    expect(analysis.loadSeries).toEqual([104, 87, 69, 69, 69, 65, 64, 65, 63, 68]);
  });

  it('handles exact closure target (10) and pre-closure targets (0 and 2)', () => {
    const initial = parseDishPlatform(EXAMPLE);

    const exact = analyzeSpinCycles(initial, 10);
    expect(exact.cycleStart).toBe(3);
    expect(exact.repeatCycle).toBe(10);
    expect(exact.equivalentCycle).toBe(3);
    expect(exact.finalLoad).toBe(69);

    const zero = analyzeSpinCycles(initial, 0);
    expect(zero.cycleStart).toBeNull();
    expect(zero.repeatCycle).toBeNull();
    expect(zero.cycleLength).toBeNull();
    expect(zero.equivalentCycle).toBe(0);
    expect(zero.history).toHaveLength(1);
    expect(zero.finalLoad).toBe(104);

    const two = analyzeSpinCycles(initial, 2);
    expect(two.cycleStart).toBeNull();
    expect(two.repeatCycle).toBeNull();
    expect(two.cycleLength).toBeNull();
    expect(two.equivalentCycle).toBe(2);
    expect(two.history).toHaveLength(3);
    expect(two.finalLoad).toBe(69);
  });

  it('handles fixed points, 1-step transients, and load collisions without false cycle closure', () => {
    const fixed = analyzeSpinCycles(parseDishPlatform('...'), 50);
    expect(fixed.cycleStart).toBe(0);
    expect(fixed.repeatCycle).toBe(1);
    expect(fixed.cycleLength).toBe(1);
    expect(fixed.equivalentCycle).toBe(0);
    expect(fixed.finalLoad).toBe(0);

    const oneStep = analyzeSpinCycles(parseDishPlatform('O.\n..'), 10);
    expect(oneStep.cycleStart).toBe(1);
    expect(oneStep.repeatCycle).toBe(2);
    expect(oneStep.cycleLength).toBe(1);
    expect(oneStep.equivalentCycle).toBe(1);
    expect(oneStep.finalLoad).toBe(1);

    const collision = analyzeSpinCycles(parseDishPlatform('O.\n##'), 10);
    expect(collision.cycleStart).toBe(1);
    expect(collision.repeatCycle).toBe(2);
    expect(collision.loadSeries).toEqual([2, 2]);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid targetCycles %s',
    (bad) => {
      const initial = parseDishPlatform('...');
      expect(() => analyzeSpinCycles(initial, bad)).toThrow(RangeError);
    },
  );
});
