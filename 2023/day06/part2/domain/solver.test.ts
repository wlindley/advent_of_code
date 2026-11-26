import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { BoatRace, RaceSheet } from '../../shared';
import { parseMergedRace, solveMergedRace, solver } from './index';

const OFFICIAL_EXAMPLE = 'Time:      7  15   30\nDistance:  9  40  200\n';

class FakeClock implements Clock {
  private idx = 0;

  constructor(private readonly ticks: readonly number[]) {}

  nowMs(): number {
    return this.ticks[this.idx++]!;
  }
}

function monotoneBinarySearchOracle(race: BoatRace): bigint {
  if (!race.beatsRecord(race.peakHold)) {
    return 0n;
  }
  let lo = 0n;
  let hi = race.peakHold;
  while (lo < hi) {
    const mid = (lo + hi) >> 1n;
    if (race.beatsRecord(mid)) {
      hi = mid;
    } else {
      lo = mid + 1n;
    }
  }
  return race.time - 2n * lo + 1n;
}

describe('2023 Day 06 Part 2 solver', () => {
  it('solves the official example to 71503n with winning range [14n, 71516n]', () => {
    const sheet = parseMergedRace(OFFICIAL_EXAMPLE);
    expect(sheet.races[0]!.winningRange?.start).toBe(14n);
    expect(sheet.races[0]!.winningRange?.end).toBe(71516n);
    expect(solveMergedRace(sheet)).toBe(71503n);
    expect(solver.solve(sheet)).toBe(71503n);
  });

  it('executes via executeSolver with a hand-written fake Clock', () => {
    const fakeClock = new FakeClock([12, 16.25]);
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result).toEqual({
      answer: 71503n,
      elapsedMs: 4.25,
      runtime: 'main-thread',
    });
  });

  it('traces a single frozen frame matching waysToWin', () => {
    const sheet = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace!(sheet);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.length).toBe(1);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.waysToWin).toBe(71503n);
    expect(frames[0]!.runningProduct).toBe(71503n);
  });

  it('freezes the solver object and propagates parse errors', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    expect(() => solver.parse('Time: 7\nInvalid: 9')).toThrow(SyntaxError);
  });

  it('matches monotoneBinarySearchOracle across edge cases and ultra-large inputs', () => {
    const cases: ReadonlyArray<readonly [bigint, bigint]> = [
      [71530n, 940200n],
      [10n, 25n],
      [10n, 24n],
      [11n, 30n],
      [11n, 29n],
      [10n, 21n],
      [11n, 24n],
      [0n, 0n],
      [1n, 0n],
      [2n, 0n],
      [100n, 0n],
      [10n, 26n],
      [11n, 31n],
      [41968862n, 214178911271055n],
      [10n ** 21n, 10n ** 41n],
      [10n ** 20n + 1n, 2n * 10n ** 39n + 7n],
    ];
    for (const [time, record] of cases) {
      const race = new BoatRace(time, record);
      const sheet = new RaceSheet([race]);
      expect(solveMergedRace(sheet)).toBe(monotoneBinarySearchOracle(race));
    }
  });
});
