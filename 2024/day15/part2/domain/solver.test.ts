import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { PART2_PUSH_RULE, solver } from './index';

const SMALL_EXAMPLE = [
  '#######',
  '#...#.#',
  '#.....#',
  '#..OO@#',
  '#..O..#',
  '#.....#',
  '#######',
  '',
  '<vv<<^^<<^^',
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

describe('2024 Day 15 Part 2 solver', () => {
  it('solves the small example to 618 with exact final rows and large example to 9021', () => {
    const smallSpec = solver.parse(SMALL_EXAMPLE);
    expect(solver.solve(smallSpec)).toBe(618);
    const smallTrace = solver.trace?.(smallSpec) ?? [];
    expect(smallTrace[smallTrace.length - 1]?.snapshot.toAsciiRows()).toEqual([
      '##############',
      '##...[].##..##',
      '##...@.[]...##',
      '##....[]....##',
      '##..........##',
      '##..........##',
      '##############',
    ]);
    expect(solver.solve(solver.parse(LARGE_EXAMPLE))).toBe(9021);
  });

  it('handles horizontal pushes and blocked chains without mutation', () => {
    const right = solver.trace?.(solver.parse('#####\n#@OO#\n#####\n\n>>')) ?? [];
    expect(right.map((f) => [f.moved, f.snapshot.toAsciiRows()[1]])).toEqual([
      [false, '##@.[][]##'],
      [true, '##.@[][]##'],
      [false, '##.@[][]##'],
    ]);

    const left = solver.trace?.(solver.parse('######\n#.OO@#\n######\n\n<<<')) ?? [];
    expect(left.map((f) => [f.moved, f.snapshot.toAsciiRows()[1]])).toEqual([
      [false, '##..[][]@.##'],
      [true, '##.[][]@..##'],
      [true, '##[][]@...##'],
      [false, '##[][]@...##'],
    ]);
  });

  it('handles aligned vertical stacks and staggered 1->2->3 fan-out', () => {
    const aligned = solver.trace?.(solver.parse('###\n#.#\n#O#\n#O#\n#@#\n#.#\n###\n\n^^vvv')) ?? [];
    expect(aligned.map((f) => [f.moved, f.snapshot.robotRow])).toEqual([
      [false, 4],
      [true, 3],
      [false, 3],
      [true, 4],
      [true, 5],
      [false, 5],
    ]);

    const fanOut = [
      '###########\n#.........#\n#..OOO@...#\n#..OO.....#\n#..O......#\n#.........#\n###########',
      '<vvv<<<<<<<^>>v>^',
    ].join('\n\n');
    const fanTrace = solver.trace?.(solver.parse(fanOut)) ?? [];
    const lastFan = fanTrace[fanTrace.length - 1]!;
    expect(lastFan.moved).toBe(true);
    expect(lastFan.snapshot.toAsciiRows().slice(1, 5)).toEqual([
      '##...[][][].........##',
      '##....[][]..........##',
      '##.....[]...........##',
      '##.....@............##',
    ]);
  });

  it('aborts asymmetric partial blocks and handles diamond convergence (open and blocked)', () => {
    const partialLeftBlocked = [
      '#########\n#..#....#\n#..OO...#\n#..O....#\n#@......#\n#########',
      '^>>>>v>^',
    ].join('\n\n');
    const leftTrace = solver.trace?.(solver.parse(partialLeftBlocked)) ?? [];
    expect(leftTrace[leftTrace.length - 1]?.moved).toBe(false);
    expect(leftTrace[leftTrace.length - 1]?.snapshot.toAsciiRows()).toEqual(
      leftTrace[leftTrace.length - 2]?.snapshot.toAsciiRows(),
    );

    const partialRightBlocked = [
      '#########\n#...#...#\n#..OO...#\n#..O....#\n#@......#\n#########',
      '^>>>>v>>^',
    ].join('\n\n');
    const rightTrace = solver.trace?.(solver.parse(partialRightBlocked)) ?? [];
    expect(rightTrace[rightTrace.length - 1]?.moved).toBe(false);
    expect(rightTrace[rightTrace.length - 1]?.snapshot.toAsciiRows()).toEqual(
      rightTrace[rightTrace.length - 2]?.snapshot.toAsciiRows(),
    );

    const diamondOpen = [
      '#########\n#.......#\n#..O....#\n#..OO...#\n#..O....#\n#@......#\n#########',
      '^^^>>>><<<vv>>>v>^',
    ].join('\n\n');
    const openTrace = solver.trace?.(solver.parse(diamondOpen)) ?? [];
    expect(openTrace[openTrace.length - 1]?.moved).toBe(true);
    expect(openTrace[openTrace.length - 1]?.snapshot.toAsciiRows().slice(1, 5)).toEqual([
      '##.....[].......##',
      '##....[][]......##',
      '##.....[].......##',
      '##.....@........##',
    ]);

    const diamondBlocked = diamondOpen.replace('#.......#', '#..#....#');
    const blockedTrace = solver.trace?.(solver.parse(diamondBlocked)) ?? [];
    expect(blockedTrace[blockedTrace.length - 1]?.moved).toBe(false);
    expect(blockedTrace[blockedTrace.length - 1]?.snapshot.toAsciiRows()).toEqual(
      blockedTrace[blockedTrace.length - 2]?.snapshot.toAsciiRows(),
    );
  });

  it('handles zero-box warehouses, unwalled boundaries, FakeClock execution, and sampled traces', () => {
    expect(solver.solve(solver.parse('###\n#@#\n###\n\n^'))).toBe(0);

    const unwalled = solver.trace?.(solver.parse('.@.\n\n^v<<>>')) ?? [];
    expect(unwalled.map((f) => [f.moved, f.snapshot.robotCol])).toEqual([
      [false, 2],
      [false, 2],
      [false, 2],
      [true, 1],
      [true, 0],
      [true, 1],
      [true, 2],
    ]);

    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (ticks += 15) };
    expect(executeSolver(solver, SMALL_EXAMPLE, fakeClock)).toEqual({
      answer: 618,
      elapsedMs: 15,
      runtime: 'main-thread',
    });

    const sampled = solver.trace?.(solver.parse(LARGE_EXAMPLE), { maxSteps: 20 });
    expect(sampled).toHaveLength(20);
    expect(sampled?.[0]?.step).toBe(0);
    expect(sampled?.[19]?.step).toBe(700);
    expect(sampled?.[19]?.snapshot.gpsSum).toBe(9021);
  });

  it('rejects invalid raw map characters and malformed specs', () => {
    expect(() => PART2_PUSH_RULE.buildInitialState({ rows: ['#?@#'], moves: [] })).toThrow(
      "Invalid raw map character '?'",
    );
    expect(() => solver.parse('only-one-section')).toThrow('Expected two sections');
    expect(() => solver.parse('##\n#\n\n^')).toThrow('rectangular');
    expect(() => solver.parse('##\n..\n\n^')).toThrow('exactly one robot');
    expect(() => solver.parse('#@#\n\nx')).toThrow("Invalid move character 'x'");
  });
});
