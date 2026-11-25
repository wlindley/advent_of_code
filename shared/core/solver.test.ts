import { describe, expect, it } from 'vitest';
import {
  executeSolver,
  formatDayFolder,
  formatPartKey,
  systemClock,
  type Clock,
  type PuzzleSolver,
} from './index';

class FakeClock implements Clock {
  private readonly timestamps: number[];
  private cursor = 0;

  constructor(timestamps: readonly number[]) {
    this.timestamps = [...timestamps];
  }

  nowMs(): number {
    const value = this.timestamps[this.cursor];
    if (value === undefined) {
      throw new Error('FakeClock exhausted');
    }
    this.cursor += 1;
    return value;
  }
}

const sumSolver: PuzzleSolver<readonly number[], number> = {
  parse(raw: string): readonly number[] {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new Error('Input must not be empty');
    }
    return trimmed.split(/\s+/).map((token) => {
      const value = Number(token);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid number: ${token}`);
      }
      return value;
    });
  },
  solve(values: readonly number[]): number {
    return values.reduce((acc, value) => acc + value, 0);
  },
};

describe('executeSolver', () => {
  it('parses, solves, and reports deterministic elapsed time', () => {
    const clock = new FakeClock([100.5, 112.75]);
    const result = executeSolver(sumSolver, '10 20 12\n', clock);

    expect(result).toEqual({
      answer: 42,
      elapsedMs: 12.25,
      runtime: 'main-thread',
    });
  });

  it('clamps negative clock deltas to zero', () => {
    const clock = new FakeClock([50, 48]);
    const result = executeSolver(sumSolver, '5', clock);

    expect(result.elapsedMs).toBe(0);
  });

  it('defaults to systemClock when no clock is provided', () => {
    const result = executeSolver(sumSolver, '1 2 3');

    expect(result.answer).toBe(6);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(systemClock.nowMs()).toBeGreaterThanOrEqual(0);
  });

  it('propagates parser validation errors', () => {
    expect(() => executeSolver(sumSolver, '   ')).toThrow('Input must not be empty');
    expect(() => executeSolver(sumSolver, '10 nope')).toThrow('Invalid number: nope');
  });
});

describe('formatDayFolder', () => {
  it('zero-pads single-digit days and preserves two-digit days', () => {
    expect(formatDayFolder(1)).toBe('day01');
    expect(formatDayFolder(12)).toBe('day12');
    expect(formatDayFolder(25)).toBe('day25');
  });

  it('rejects non-integer days', () => {
    expect(() => formatDayFolder(1.5)).toThrow('Day must be an integer between 1 and 25');
  });

  it('rejects days below 1', () => {
    expect(() => formatDayFolder(0)).toThrow('Day must be an integer between 1 and 25');
  });

  it('rejects days above 25', () => {
    expect(() => formatDayFolder(26)).toThrow('Day must be an integer between 1 and 25');
  });
});

describe('formatPartKey', () => {
  it('formats canonical year/day/part identifiers', () => {
    expect(formatPartKey(2025, 1, 1)).toBe('2025/day01/part1');
    expect(formatPartKey(2015, 25, 2)).toBe('2015/day25/part2');
  });

  it('rejects years before 2015', () => {
    expect(() => formatPartKey(2014, 1, 1)).toThrow('Year must be an integer >= 2015');
  });

  it('rejects non-integer years', () => {
    expect(() => formatPartKey(2025.5, 1, 1)).toThrow('Year must be an integer >= 2015');
  });
});
