import { describe, expect, it } from 'vitest';
import { parseBasin } from './parser';
import { DEFAULT_TRACE_MAX_STEPS, solveTrip, traceTrip } from './trip';
import { PART1_WAYPOINTS, PART2_WAYPOINTS } from './types';

const OFFICIAL_EXAMPLE = [
  '#.######',
  '#>>.<^<#',
  '#.<..<<#',
  '#>v.><>#',
  '#<^v^^>#',
  '######.#',
].join('\n');

describe('solveTrip and traceTrip', () => {
  it('solves Part 1 (18) and Part 2 (54) trips on the official 6x8 example', () => {
    const basin = parseBasin(OFFICIAL_EXAMPLE);
    const part1 = solveTrip(basin, PART1_WAYPOINTS);
    expect(part1.totalMinutes).toBe(18);
    expect(part1.legDurations).toEqual([18]);

    const part2 = solveTrip(basin, PART2_WAYPOINTS);
    expect(part2.totalMinutes).toBe(54);
    expect(part2.legDurations).toEqual([18, 23, 13]);
  });

  it('rejects waypoint lists shorter than 2 stops', () => {
    const basin = parseBasin('#.#\n#.#\n#.#');
    expect(() => solveTrip(basin, [])).toThrow(RangeError);
    expect(() => solveTrip(basin, ['start'])).toThrow(RangeError);
  });

  it('produces complete and bounded traces preserving start and end endpoints', () => {
    const basin = parseBasin(OFFICIAL_EXAMPLE);
    const fullPart1 = traceTrip(basin, PART1_WAYPOINTS);
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(120);
    expect(fullPart1).toHaveLength(19);
    expect(fullPart1[0]!.minute).toBe(0);
    expect(fullPart1[0]!.action).toBe('start');
    expect(fullPart1[0]!.legIndex).toBe(0);
    expect(fullPart1[0]!.legCount).toBe(1);
    expect(fullPart1[0]!.position).toEqual({ row: 0, col: 1 });
    expect(fullPart1[18]!.minute).toBe(18);
    expect(fullPart1[18]!.position).toEqual({ row: 5, col: 6 });

    const fullPart2 = traceTrip(basin, PART2_WAYPOINTS);
    expect(fullPart2).toHaveLength(55);
    expect(fullPart2[18]!.legIndex).toBe(0);
    expect(fullPart2[19]!.legIndex).toBe(1);
    expect(fullPart2[41]!.legIndex).toBe(1);
    expect(fullPart2[42]!.legIndex).toBe(2);
    expect(fullPart2[54]!.minute).toBe(54);
    expect(fullPart2[54]!.legCount).toBe(3);

    const actions = new Set(fullPart2.map((f) => f.action));
    expect(actions).toEqual(new Set(['start', 'wait', 'up', 'down', 'left', 'right']));

    const capped = traceTrip(basin, PART2_WAYPOINTS, { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    expect(capped[0]!.minute).toBe(0);
    expect(capped[9]!.minute).toBe(54);
    expect(() => traceTrip(basin, PART1_WAYPOINTS, { maxSteps: 0 })).toThrow(RangeError);
  });
});
