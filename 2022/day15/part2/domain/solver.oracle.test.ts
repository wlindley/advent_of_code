import { describe, expect, it } from 'vitest';
import { mergedRowCoverage, parseSensorReadings, SensorReading } from '../../shared';
import { findDistressBeacon, type DistressPoint } from './index';

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextInt(min: number, max: number): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return min + (this.state % (max - min + 1));
  }
}

function scanUncoveredByRows(readings: readonly SensorReading[], maxCoord: number): readonly DistressPoint[] {
  const uncovered: DistressPoint[] = [];
  for (let y = 0; y <= maxCoord; y += 1) {
    const union = mergedRowCoverage(readings, y);
    let cursor = 0;
    for (const iv of union.intervals) {
      const start = Math.max(0, Number(iv.start));
      const end = Math.min(maxCoord, Number(iv.end));
      if (end < 0 || start > maxCoord) continue;
      for (let x = cursor; x < start; x += 1) uncovered.push({ x, y });
      cursor = Math.max(cursor, end + 1);
    }
    for (let x = cursor; x <= maxCoord; x += 1) uncovered.push({ x, y });
  }
  return uncovered;
}

const EXAMPLE_INPUT = [
  'Sensor at x=2, y=18: closest beacon is at x=-2, y=15',
  'Sensor at x=9, y=16: closest beacon is at x=10, y=16',
  'Sensor at x=13, y=2: closest beacon is at x=15, y=3',
  'Sensor at x=12, y=14: closest beacon is at x=10, y=16',
  'Sensor at x=10, y=20: closest beacon is at x=10, y=16',
  'Sensor at x=14, y=17: closest beacon is at x=10, y=16',
  'Sensor at x=8, y=7: closest beacon is at x=2, y=10',
  'Sensor at x=2, y=0: closest beacon is at x=2, y=10',
  'Sensor at x=0, y=11: closest beacon is at x=2, y=10',
  'Sensor at x=20, y=14: closest beacon is at x=25, y=17',
  'Sensor at x=17, y=20: closest beacon is at x=21, y=22',
  'Sensor at x=16, y=7: closest beacon is at x=15, y=3',
  'Sensor at x=14, y=3: closest beacon is at x=15, y=3',
  'Sensor at x=20, y=1: closest beacon is at x=15, y=3',
].join('\n');

function buildRandomReadings(rng: SeededRng, maxCoord: number): readonly SensorReading[] {
  const tx = rng.nextInt(0, maxCoord);
  const ty = rng.nextInt(0, maxCoord);
  const readings: SensorReading[] = [];
  for (let i = 0; i < 18; i += 1) {
    const sx = rng.nextInt(-4, maxCoord + 4);
    const sy = rng.nextInt(-4, maxCoord + 4);
    const distToTarget = Math.abs(sx - tx) + Math.abs(sy - ty);
    if (distToTarget === 0) continue;
    const radius = Math.min(distToTarget - 1, rng.nextInt(3, 18));
    readings.push(new SensorReading(sx, sy, sx + radius, sy));
  }
  return readings;
}

describe('differential oracle: row-by-row mergedRowCoverage vs candidate solver', () => {
  it('matches oracle on official example, corners, edges, odd pinches, and M = 0', () => {
    const cases: ReadonlyArray<readonly [readonly SensorReading[], number]> = [
      [parseSensorReadings(EXAMPLE_INPUT), 20],
      [[new SensorReading(4, 4, 4, -3)], 4],
      [[new SensorReading(3, 0, 3, -4), new SensorReading(3, 4, 3, 8)], 4],
      [[
        new SensorReading(0, 0, 0, 3),
        new SensorReading(4, 4, 4, 1),
        new SensorReading(0, 3, 0, 4),
        new SensorReading(3, 0, 4, 0),
      ], 4],
      [[new SensorReading(1, 0, 1, 0)], 0],
    ];
    for (const [readings, maxCoord] of cases) {
      const oracle = scanUncoveredByRows(readings, maxCoord);
      expect(oracle.length).toBe(1);
      expect(findDistressBeacon(readings, maxCoord)).toEqual(oracle[0]);
    }
  });

  it('agrees across 40 seeded random [0, 25]^2 sensor layouts', () => {
    const rng = new SeededRng(20221502);
    let uniqueSolvedCount = 0;
    for (let trial = 0; trial < 40; trial += 1) {
      const readings = buildRandomReadings(rng, 25);
      const oracle = scanUncoveredByRows(readings, 25);
      if (oracle.length === 1) {
        uniqueSolvedCount += 1;
        expect(findDistressBeacon(readings, 25)).toEqual(oracle[0]);
      } else {
        expect(() => findDistressBeacon(readings, 25)).toThrow(Error);
      }
    }
    expect(uniqueSolvedCount).toBeGreaterThan(0);
  });
});
