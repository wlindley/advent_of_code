import { describe, expect, it } from 'vitest';
import { SonarReport } from './sonarReport';
import {
  DEFAULT_MAX_TRACE_STEPS,
  classifyDelta,
  countWindowIncreases,
  traceWindowIncreases,
} from './windowSweep';

const EXAMPLE_DEPTHS = [199, 200, 208, 210, 200, 207, 240, 269, 260, 263];

function oracleWindowIncreases(report: SonarReport, windowSize: number): number {
  let increases = 0;
  for (let start = 1; start + windowSize <= report.count; start += 1) {
    if (report.windowSum(start, windowSize) > report.windowSum(start - 1, windowSize)) {
      increases += 1;
    }
  }
  return increases;
}

function seededDepths(seed: number, length: number): number[] {
  let state = seed >>> 0;
  const values: number[] = [];
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    values.push((state % 41) - 20);
  }
  return values;
}

describe('classifyDelta', () => {
  it('classifies increase, decrease, and equal', () => {
    expect(classifyDelta(-10, -5)).toBe('increase');
    expect(classifyDelta(210, 200)).toBe('decrease');
    expect(classifyDelta(42, 42)).toBe('equal');
  });
});

describe('countWindowIncreases', () => {
  it('matches the official example for W=1 and W=3', () => {
    const report = new SonarReport(EXAMPLE_DEPTHS);
    expect(countWindowIncreases(report, 1)).toBe(7);
    expect(countWindowIncreases(report, 3)).toBe(5);
  });

  it('returns 0 when fewer than windowSize + 1 readings exist and rejects invalid W', () => {
    const short = new SonarReport([10, 20, 30]);
    expect(countWindowIncreases(short, 3)).toBe(0);
    expect(countWindowIncreases(short, 5)).toBe(0);
    expect(() => countWindowIncreases(short, 0)).toThrow(RangeError);
  });

  it('agrees with an O(N*W) BigInt windowSum oracle across W=1,2,3,5', () => {
    const reports = [
      new SonarReport(EXAMPLE_DEPTHS),
      new SonarReport(seededDepths(1337, 45)),
      new SonarReport(seededDepths(9001, 60)),
      new SonarReport([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER]),
    ];
    for (const report of reports) {
      for (const w of [1, 2, 3, 5]) {
        expect(countWindowIncreases(report, w)).toBe(oracleWindowIncreases(report, w));
      }
    }
  });
});

describe('traceWindowIncreases', () => {
  it('validates windowSize and maxSteps even when no comparisons exist', () => {
    const single = new SonarReport([199]);
    expect(traceWindowIncreases(single, 1)).toEqual([]);
    expect(Object.isFrozen(traceWindowIncreases(single, 3))).toBe(true);
    expect(() => traceWindowIncreases(single, 0)).toThrow(RangeError);
    for (const badSteps of [0, -2, 1.5, Number.NaN]) {
      expect(() => traceWindowIncreases(single, 1, { maxSteps: badSteps })).toThrow(RangeError);
    }
  });

  it('emits frozen per-step cancellation frames for W=1 and W=3', () => {
    const report = new SonarReport(EXAMPLE_DEPTHS);
    const w1Frames = traceWindowIncreases(report, 1);
    expect(Object.isFrozen(w1Frames)).toBe(true);
    expect(Object.isFrozen(w1Frames[0])).toBe(true);
    expect(w1Frames).toHaveLength(9);
    expect(w1Frames[0]).toEqual({
      comparisonIndex: 0,
      exitingDepth: 199,
      enteringDepth: 200,
      deltaKind: 'increase',
      increasesSoFar: 1,
    });
    expect(w1Frames[8]?.increasesSoFar).toBe(7);

    const w3Frames = traceWindowIncreases(report, 3);
    expect(w3Frames).toHaveLength(7);
    expect(w3Frames[1]).toEqual({
      comparisonIndex: 1,
      exitingDepth: 200,
      enteringDepth: 200,
      deltaKind: 'equal',
      increasesSoFar: 1,
    });
    expect(w3Frames[6]?.increasesSoFar).toBe(5);
  });

  it('samples large traces to maxSteps and preserves final increase count', () => {
    const report = new SonarReport(seededDepths(2021, 300));
    const expected = countWindowIncreases(report, 3);

    const defaultSampled = traceWindowIncreases(report, 3);
    expect(defaultSampled).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultSampled[0]?.comparisonIndex).toBe(0);
    expect(defaultSampled[defaultSampled.length - 1]?.comparisonIndex).toBe(296);
    expect(defaultSampled[defaultSampled.length - 1]?.increasesSoFar).toBe(expected);

    const singleSample = traceWindowIncreases(report, 1, { maxSteps: 1 });
    expect(singleSample).toHaveLength(1);
    expect(singleSample[0]?.comparisonIndex).toBe(298);
    expect(singleSample[0]?.increasesSoFar).toBe(countWindowIncreases(report, 1));
  });
});
