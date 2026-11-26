import { describe, expect, it } from 'vitest';
import { computeBfsDistances } from './bfs';
import { analyzeCheats, CheatSummary } from './cheats';
import {
  Cheat,
  CheatConfig,
  GridPoint,
  PART1_DEFAULT_CONFIG,
  PART1_EXAMPLE_CONFIG,
  PART2_EXAMPLE_CONFIG,
} from './model';
import { parseRacetrack } from './parser';

const EXAMPLE_TRACK = [
  '###############',
  '#...#...#.....#',
  '#.#.#.#.#.###.#',
  '#S#...#.#.#...#',
  '#######.#.#.###',
  '#######.#.#...#',
  '#######.#.###.#',
  '###..E#...#...#',
  '###.#######.###',
  '#...###...#...#',
  '#.#####.#.###.#',
  '#.#...#.#.#...#',
  '#.#.#.#.#.#.###',
  '#...#...#...###',
  '###############',
].join('\n');

describe('analyzeCheats', () => {
  it('matches official AoC 2024 Day 20 Part 1 and Part 2 example counts', () => {
    const field = computeBfsDistances(parseRacetrack(EXAMPLE_TRACK));
    expect(field.baseline).toBe(84);

    const p1 = analyzeCheats(field, PART1_EXAMPLE_CONFIG);
    expect(p1.totalCount).toBe(44);
    expect(p1.maxSaving).toBe(64);
    expect(p1.bestCheat?.saving).toBe(64);
    expect(p1.buckets.map((b) => [b.saving, b.count])).toEqual([
      [2, 14], [4, 14], [6, 2], [8, 4], [10, 2], [12, 3],
      [20, 1], [36, 1], [38, 1], [40, 1], [64, 1],
    ]);

    const p2 = analyzeCheats(field, PART2_EXAMPLE_CONFIG);
    expect(p2.totalCount).toBe(285);
    expect(p2.maxSaving).toBe(76);
    expect(p2.buckets.map((b) => [b.saving, b.count])).toEqual([
      [50, 32], [52, 31], [54, 29], [56, 39], [58, 25], [60, 23], [62, 20],
      [64, 19], [66, 12], [68, 14], [70, 12], [72, 22], [74, 4], [76, 3],
    ]);

    const p1Default = analyzeCheats(field, PART1_DEFAULT_CONFIG);
    expect(p1Default.totalCount).toBe(0);
    expect(p1Default.maxSaving).toBe(0);
    expect(p1Default.bestCheat).toBeNull();
  });

  it('handles disconnected S/E, exact threshold, diagonal d=2 corner, dead-end, and unreachable pocket', () => {
    const disconnected = computeBfsDistances(parseRacetrack('S#E'));
    expect(analyzeCheats(disconnected, new CheatConfig(2, 1)).totalCount).toBe(0);

    // U-bend S#E / ... has baseline=4; minSaving=2 exercises exact threshold baseline === minSaving + 2.
    const uBend = computeBfsDistances(parseRacetrack('S#E\n...'));
    expect(uBend.baseline).toBe(4);
    const threshold = analyzeCheats(uBend, new CheatConfig(2, 2));
    expect(threshold.totalCount).toBe(1);
    expect(threshold.maxSaving).toBe(2);
    expect(analyzeCheats(uBend, new CheatConfig(2, 3)).totalCount).toBe(0);

    // Diagonal d=2 L-corner (1,3)->(2,2) across walls, plus unreachable pocket at (2,0).
    const cornerWithPocket = computeBfsDistances(
      parseRacetrack(['S...#', '###..', '.#E#.', '##...', '.#...'].join('\n')),
    );
    const cornerSummary = analyzeCheats(cornerWithPocket, new CheatConfig(2, 2));
    expect(cornerSummary.totalCount).toBeGreaterThan(0);
    expect(cornerSummary.maxSaving).toBe(6);

    // Dead-end branch off main path does not create spurious negative savings.
    const deadEnd = computeBfsDistances(parseRacetrack(['S..E', '.###', '.###'].join('\n')));
    expect(analyzeCheats(deadEnd, new CheatConfig(2, 1)).totalCount).toBe(0);
  });

  it('sorts CheatSummary buckets ascending and freezes summary', () => {
    const b10 = { saving: 10, count: 2, witness: new Cheat(new GridPoint(0, 0), new GridPoint(0, 2), 10) };
    const b4 = { saving: 4, count: 3, witness: new Cheat(new GridPoint(1, 0), new GridPoint(1, 2), 4) };
    const summary = new CheatSummary([b10, b4]);

    expect(Object.isFrozen(summary)).toBe(true);
    expect(summary.buckets.map((b) => b.saving)).toEqual([4, 10]);
    expect(summary.totalCount).toBe(5);
    expect(summary.maxSaving).toBe(10);
    expect(summary.bestCheat).toBe(b10.witness);
  });
});
