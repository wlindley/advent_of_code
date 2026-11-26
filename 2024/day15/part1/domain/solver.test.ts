import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const SMALL_EXAMPLE = [
  '########',
  '#..O.O.#',
  '##@.O..#',
  '#...O..#',
  '#.#.O..#',
  '#...O..#',
  '#......#',
  '########',
  '',
  '<^^>>>vv<v>>v<<',
].join('\n');

const LARGE_EXAMPLE = [
  '##########',
  '#..O..O.O#',
  '#......O.#',
  '#.OO..O.O#',
  '#..O@..O.#',
  '#O#..O...#',
  '#O..O..O.#',
  '#.OO.O.OO#',
  '#....O...#',
  '##########',
  '',
  '<vv>^<v^>v>^vv^v>v<>v^v<v<^vv<<<^><<><>>v<vvv<>^v^>^<<<><<v<<<v^vv^v>^',
  'vvv<<^>^v^^><<>>><>^<<><^vv^^<>vvv<>><^^v>^>vv<>v<<<<v<^v>^<^^>>>^<v<v',
  '><>vv>v^v^<>><>>>><^^>vv>v<^^^>>v^v^<^^>v^^>v^<^v>v<>>v^v^<v>v^^<^^vv<',
  '<<v<^>>^^^^>>>v^<>vvv^><v<<<>^^^vv^<vvv>^>v<^^^^v<>^>vvvv><>>v^<<^^^^^',
  '^><^><>>><>^^<<^^v>>><^<v>^<vv>>v>>>^v><>^v><<<<v>>v<v<v>vvv>^<><<>^><',
  '^>><>^v<><^vvv<^^<><v<<<<<><^v<<<><<<^^<v<^^^><^>>^<v^><<<^>>^v<v^v<v^',
  '>^>>^v>vv>^<<^v<>><<><<v<<v><>v<^vv<<<>^^v^>^^>>><<^v>>v^v><^^>>^<>vv^',
  '<><^^>^^^<><vvvvv^v<v<<>^v<v>v<<^><<><<><<<^^<<<^<<>><<><^^^>^^<>^>v<>',
  '^^>vv<^v^v<vv>^<><v<^v>^^^>>>^^vvv^>vvv<>>>^<^>>>>>^<<^v>^vvv<>^<><<v>',
  'v^^>>><<^^<>>^v^<v^vv<>v^<<>^<^v^v><^<<<><<^<v><v<>vv>>v><v^<vv<>v^<<^',
].join('\n');

describe('2024 Day 15 Part 1 solver', () => {
  it('solves the small example to 2028 and large example to 10092', () => {
    expect(solver.solve(solver.parse(SMALL_EXAMPLE))).toBe(2028);
    expect(solver.solve(solver.parse(LARGE_EXAMPLE))).toBe(10092);
  });

  it('handles all four directions, multi-box chains, blocked moves, and unwalled edges', () => {
    const horizontal = solver.parse('#######\n#@OO..#\n#######\n\n>><');
    expect(solver.solve(horizontal)).toBe(104 + 105);

    const verticalAndBlocked = solver.parse('###\n#.#\n#O#\n#O#\n#@#\n#.#\n###\n\n^^vvv');
    const trace = solver.trace?.(verticalAndBlocked);
    expect(trace?.map((f) => [f.move, f.moved, f.snapshot.robotRow])).toEqual([
      [null, false, 4],
      ['^', true, 3],
      ['^', false, 3],
      ['v', true, 4],
      ['v', true, 5],
      ['v', false, 5],
    ]);

    const unwalled = solver.parse('.@.\n\n^v<>');
    const unwalledTrace = solver.trace?.(unwalled);
    expect(unwalledTrace?.map((f) => [f.move, f.moved, f.snapshot.robotCol])).toEqual([
      [null, false, 1],
      ['^', false, 1],
      ['v', false, 1],
      ['<', true, 0],
      ['>', true, 1],
    ]);
  });

  it('executes via executeSolver with a deterministic clock fake and supports sampled traces', () => {
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (ticks += 12) };
    const result = executeSolver(solver, SMALL_EXAMPLE, fakeClock);
    expect(result).toEqual({ answer: 2028, elapsedMs: 12, runtime: 'main-thread' });

    const sampled = solver.trace?.(solver.parse(LARGE_EXAMPLE), { maxSteps: 20 });
    expect(sampled).toHaveLength(20);
    expect(sampled?.[0]?.step).toBe(0);
    expect(sampled?.[19]?.step).toBe(700);
    expect(sampled?.[19]?.snapshot.gpsSum).toBe(10092);
  });
});
