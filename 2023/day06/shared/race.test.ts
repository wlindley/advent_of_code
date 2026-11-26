import { describe, expect, it } from 'vitest';
import { BoatRace, RaceSheet } from './race';

function directHoldScanOracle(race: BoatRace): bigint {
  let count = 0n;
  for (let h = 0n; h <= race.time; h += 1n) {
    if (h * (race.time - h) > race.recordDistance) count += 1n;
  }
  return count;
}

function monotoneBinarySearchOracle(race: BoatRace): bigint {
  const peak = race.time >> 1n;
  if (peak * (race.time - peak) <= race.recordDistance) return 0n;
  let lo = 0n;
  let hi = peak;
  while (lo < hi) {
    const mid = (lo + hi) >> 1n;
    if (mid * (race.time - mid) > race.recordDistance) hi = mid;
    else lo = mid + 1n;
  }
  return race.time - 2n * lo + 1n;
}

describe('BoatRace', () => {
  it('computes distance, winning predicate, and waysToWin for the official 3 races', () => {
    const r1 = new BoatRace(7n, 9n);
    const r2 = new BoatRace(15n, 40n);
    const r3 = new BoatRace(30n, 200n);

    expect(r1.distanceForHold(0n)).toBe(0n);
    expect(r1.distanceForHold(2n)).toBe(10n);
    expect(r1.beatsRecord(1n)).toBe(false);
    expect(r1.beatsRecord(2n)).toBe(true);
    expect(r1.peakHold).toBe(3n);
    expect(r1.maxDistance).toBe(12n);
    expect(r1.waysToWin).toBe(4n);
    expect([r1.winningRange?.start, r1.winningRange?.end]).toEqual([2n, 5n]);
    expect(r2.waysToWin).toBe(8n);
    expect(r3.waysToWin).toBe(9n);
    expect(Object.isFrozen(r1)).toBe(true);
  });

  it('handles boundary races including zero-winner cases', () => {
    const cases: readonly [bigint, bigint, bigint][] = [
      [0n, 0n, 0n],
      [1n, 0n, 0n],
      [2n, 0n, 1n],
      [3n, 2n, 0n],
      [3n, 1n, 2n],
      [4n, 4n, 0n],
      [10n, 100n, 0n],
    ];
    for (const [time, record, expected] of cases) {
      const race = new BoatRace(time, record);
      expect(race.waysToWin).toBe(expected);
      if (expected === 0n) expect(race.winningRange).toBeUndefined();
      else expect(race.winningRange?.length).toBe(expected);
    }
  });

  it('rejects negative race parameters and out-of-range hold times', () => {
    expect(() => new BoatRace(-1n, 0n)).toThrow(RangeError);
    expect(() => new BoatRace(0n, -1n)).toThrow(RangeError);
    const race = new BoatRace(5n, 3n);
    expect(() => race.distanceForHold(-1n)).toThrow(RangeError);
    expect(() => race.distanceForHold(6n)).toThrow(RangeError);
  });

  it('matches exhaustive direct hold scan for all 0 <= T <= 40', () => {
    for (let t = 0n; t <= 40n; t += 1n) {
      const maxD = (t * t) / 4n + 2n;
      for (let d = 0n; d <= maxD; d += 1n) {
        const race = new BoatRace(t, d);
        expect(race.waysToWin).toBe(directHoldScanOracle(race));
      }
    }
  });

  it('matches monotone binary search oracle at Part 2 and 10^18 scales', () => {
    const part2Example = new BoatRace(71530n, 940200n);
    expect(part2Example.waysToWin).toBe(71503n);
    expect(part2Example.waysToWin).toBe(monotoneBinarySearchOracle(part2Example));

    const part2Scale = new BoatRace(40_000_000n, 240_000_000_000_000n);
    expect(part2Scale.waysToWin).toBe(monotoneBinarySearchOracle(part2Scale));

    for (const t of [10n ** 18n, 10n ** 18n + 1n]) {
      const peak = t >> 1n;
      const peakDist = peak * (t - peak);
      const records = [0n, peakDist - 1n, peakDist, peakDist + 1n];
      for (const d of records) {
        const race = new BoatRace(t, d);
        expect(race.waysToWin).toBe(monotoneBinarySearchOracle(race));
      }
    }
  });
});

describe('RaceSheet', () => {
  it('computes exact product of waysToWin and freezes sheet', () => {
    const sheet = new RaceSheet([new BoatRace(7n, 9n), new BoatRace(15n, 40n), new BoatRace(30n, 200n)]);
    expect(sheet.errorMargin).toBe(288n);
    expect(Object.isFrozen(sheet)).toBe(true);
    expect(Object.isFrozen(sheet.races)).toBe(true);
  });

  it('returns 0n when any race has zero winning hold times', () => {
    const sheet = new RaceSheet([new BoatRace(7n, 9n), new BoatRace(4n, 4n)]);
    expect(sheet.errorMargin).toBe(0n);
  });

  it('rejects an empty race list', () => {
    expect(() => new RaceSheet([])).toThrow(RangeError);
  });
});
