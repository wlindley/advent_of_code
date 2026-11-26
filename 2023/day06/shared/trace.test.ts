import { describe, expect, it } from 'vitest';
import { BoatRace, RaceSheet } from './race';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_PARABOLA_SEGMENTS,
  RaceTraceFrame,
  ratioBigInt,
  sampleRaceParabola,
  traceRaceSheet,
} from './trace';

describe('ratioBigInt', () => {
  it('computes bounded [0, 1] ratios across zero, equal, overflow, and large scales', () => {
    expect(ratioBigInt(5n, 0n)).toBe(0);
    expect(ratioBigInt(0n, 10n)).toBe(0);
    expect(ratioBigInt(-3n, 10n)).toBe(0);
    expect(ratioBigInt(10n, 10n)).toBe(1);
    expect(ratioBigInt(15n, 10n)).toBe(1);
    expect(ratioBigInt(1n, 4n)).toBe(0.25);
    expect(ratioBigInt(10n ** 30n, 4n * 10n ** 30n)).toBe(0.25);
  });

  it('rejects negative denominators', () => {
    expect(() => ratioBigInt(1n, -1n)).toThrow(RangeError);
  });
});

describe('sampleRaceParabola', () => {
  it('includes every integer hold when race time <= maxSegments', () => {
    const race = new BoatRace(7n, 9n);
    const samples = sampleRaceParabola(race);
    expect(samples.length).toBe(8);
    expect(samples[0]).toEqual({ holdTime: 0n, distance: 0n, xRatio: 0, yRatio: 0, isWinner: false });
    expect(samples[2]!.isWinner).toBe(true);
    expect(samples[3]!.distance).toBe(12n);
    expect(samples[3]!.yRatio).toBe(1);
    expect(samples[7]!.xRatio).toBe(1);
    expect(Object.isFrozen(samples)).toBe(true);
    expect(Object.isFrozen(samples[0])).toBe(true);
  });

  it('handles zero-duration race', () => {
    const samples = sampleRaceParabola(new BoatRace(0n, 0n));
    expect(samples).toEqual([{ holdTime: 0n, distance: 0n, xRatio: 0, yRatio: 0, isWinner: false }]);
  });

  it('subsamples large winnable races while preserving peak and winning endpoints', () => {
    const race = new BoatRace(71530n, 940200n);
    const samples = sampleRaceParabola(race, 16);
    const holds = samples.map((s) => s.holdTime);
    expect(holds[0]).toBe(0n);
    expect(holds[holds.length - 1]).toBe(71530n);
    expect(holds).toContain(race.peakHold);
    expect(holds).toContain(14n);
    expect(holds).toContain(71516n);
    for (let i = 1; i < holds.length; i += 1) {
      expect(holds[i]! > holds[i - 1]!).toBe(true);
    }
  });

  it('subsamples large unwinnable races without winners', () => {
    const race = new BoatRace(1000n, 500_000n);
    const samples = sampleRaceParabola(race, 10);
    expect(samples.length).toBeLessThanOrEqual(12);
    expect(samples.every((s) => !s.isWinner)).toBe(true);
    expect(samples.map((s) => s.holdTime)).toContain(500n);
  });

  it('rejects non-positive or non-integer maxSegments', () => {
    const race = new BoatRace(7n, 9n);
    expect(() => sampleRaceParabola(race, 0)).toThrow(RangeError);
    expect(() => sampleRaceParabola(race, 2.5)).toThrow(RangeError);
    expect(DEFAULT_PARABOLA_SEGMENTS).toBe(64);
  });
});

describe('RaceTraceFrame', () => {
  it('exposes race getters and freezes itself', () => {
    const winnable = new BoatRace(7n, 9n);
    const f1 = new RaceTraceFrame(0, 2, winnable, 4n);
    expect(f1.raceIndex).toBe(0);
    expect(f1.totalRaces).toBe(2);
    expect(f1.waysToWin).toBe(4n);
    expect([f1.winningRange?.start, f1.winningRange?.end]).toEqual([2n, 5n]);
    expect(f1.hasWinners).toBe(true);
    expect(f1.runningProduct).toBe(4n);
    expect(Object.isFrozen(f1)).toBe(true);

    const unwinnable = new BoatRace(4n, 4n);
    const f2 = new RaceTraceFrame(1, 2, unwinnable, 0n);
    expect(f2.waysToWin).toBe(0n);
    expect(f2.winningRange).toBeUndefined();
    expect(f2.hasWinners).toBe(false);
  });

  it('validates totalRaces, raceIndex, and runningProduct separately', () => {
    const race = new BoatRace(7n, 9n);
    expect(() => new RaceTraceFrame(0, 0, race, 1n)).toThrow(RangeError);
    expect(() => new RaceTraceFrame(-1, 2, race, 1n)).toThrow(RangeError);
    expect(() => new RaceTraceFrame(2, 2, race, 1n)).toThrow(RangeError);
    expect(() => new RaceTraceFrame(0, 2, race, -1n)).toThrow(RangeError);
  });
});

describe('traceRaceSheet', () => {
  const sheet = new RaceSheet([
    new BoatRace(7n, 9n),
    new BoatRace(15n, 40n),
    new BoatRace(30n, 200n),
    new BoatRace(10n, 20n),
    new BoatRace(12n, 30n),
  ]);

  it('traces all races by default with cumulative running products', () => {
    const frames = traceRaceSheet(sheet);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    expect(frames.length).toBe(5);
    expect(frames.map((f) => f.runningProduct)).toEqual([4n, 32n, 288n, 1440n, 7200n]);
    expect(Object.isFrozen(frames)).toBe(true);
  });

  it('subsamples to maxSteps = 3 and maxSteps = 1 while keeping exact runningProduct', () => {
    const three = traceRaceSheet(sheet, { maxSteps: 3 });
    expect(three.map((f) => f.raceIndex)).toEqual([0, 2, 4]);
    expect(three.map((f) => f.runningProduct)).toEqual([4n, 288n, 7200n]);

    const one = traceRaceSheet(sheet, { maxSteps: 1 });
    expect(one.length).toBe(1);
    expect(one[0]!.raceIndex).toBe(4);
    expect(one[0]!.runningProduct).toBe(7200n);
  });

  it('rejects invalid maxSteps', () => {
    expect(() => traceRaceSheet(sheet, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceRaceSheet(sheet, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
