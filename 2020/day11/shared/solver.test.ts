import { describe, expect, it } from 'vitest';
import { ADJACENT_SEATING_RULE, LINE_OF_SIGHT_SEATING_RULE } from './rules';
import { SeatingSystemSolver } from './solver';

const EXAMPLE_10X10 = [
  'L.LL.LL.LL',
  'LLLLLLL.LL',
  'L.L.L..L..',
  'LLLL.LL.LL',
  'L.LL.LL.LL',
  'L.LLLLL.LL',
  '..L.L.....',
  'LLLLLLLLLL',
  'L.LLLLLL.L',
  'L.LLLLL.LL',
].join('\n');

describe('SeatingSystemSolver', () => {
  it('parses, solves, and traces layouts for a configured SeatingRule', () => {
    const p1 = new SeatingSystemSolver(ADJACENT_SEATING_RULE);
    const p2 = new SeatingSystemSolver(LINE_OF_SIGHT_SEATING_RULE);

    const layout = p1.parse(EXAMPLE_10X10);
    expect(p1.rule).toBe(ADJACENT_SEATING_RULE);
    expect(p1.solve(layout)).toBe(37);
    expect(p2.solve(layout)).toBe(26);

    const defaultTrace = p1.trace(layout);
    expect(defaultTrace).toHaveLength(6);
    expect(defaultTrace[5]!.occupiedCount).toBe(37);

    const cappedTrace = p1.trace(layout, { maxSteps: 3 });
    expect(cappedTrace.map((f) => f.round)).toEqual([0, 3, 5]);
    expect(() => p1.trace(layout, { maxSteps: 0 })).toThrow(RangeError);
  });
});
