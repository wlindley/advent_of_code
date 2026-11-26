import { describe, expect, it } from 'vitest';
import { countFiniteReachable } from './gardenBfs';
import { parseGardenMap } from './gardenMap';
import { buildGardenTrace, DEFAULT_MAX_TRACE_STEPS } from './gardenTrace';

const OFFICIAL_11X11 = [
  '...........',
  '.....###.#.',
  '.###.##..#.',
  '..#.#...#..',
  '....#.#....',
  '.##..S####.',
  '.##..#...#.',
  '.......##..',
  '.##.#.####.',
  '.##..##.##.',
  '...........',
].join('\n');

describe('buildGardenTrace', () => {
  it('builds exact per-step frames matching countFiniteReachable when within cap', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    const frames = buildGardenTrace(map, 6);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(128);
    expect(frames).toHaveLength(7);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    for (const frame of frames) {
      expect(frame.totalSteps).toBe(6);
      expect(frame.reachableCount).toBe(countFiniteReachable(map, frame.step));
      expect(frame.parity).toBe(frame.step % 2 === 0 ? 'even' : 'odd');
    }
    expect(frames[0]!.frontierCount).toBe(1);
    expect(frames[6]!.reachableCount).toBe(16);
    expect(frames[6]!.caption).toContain('16 reachable');
  });

  it('samples endpoints when total frames exceed maxSteps and supports single-frame cap', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    const sampled = buildGardenTrace(map, 10, { maxSteps: 4 });
    expect(sampled.map((f) => f.step)).toEqual([0, 3, 7, 10]);

    const single = buildGardenTrace(map, 10, { maxSteps: 1 });
    expect(single.map((f) => f.step)).toEqual([10]);
  });

  it('handles step 0 and isolated S maps with zero reachable/frontier after step 0', () => {
    const map = parseGardenMap('S');
    const zero = buildGardenTrace(map, 0);
    expect(zero).toHaveLength(1);
    expect(zero[0]).toMatchObject({ step: 0, totalSteps: 0, reachableCount: 1, frontierCount: 1, parity: 'even' });

    const isolated = buildGardenTrace(map, 2);
    expect(isolated[0]!.reachableCount).toBe(1);
    expect(isolated[1]).toMatchObject({ step: 1, reachableCount: 0, frontierCount: 0, parity: 'odd' });
    expect(isolated[2]).toMatchObject({ step: 2, reachableCount: 0, frontierCount: 0, parity: 'even' });
    expect(isolated[2]!.caption).toContain('Isolated S');
  });

  it('rejects invalid maxSteps options', () => {
    const map = parseGardenMap('S.');
    expect(() => buildGardenTrace(map, 2, { maxSteps: 0 })).toThrow(RangeError);
  });
});
