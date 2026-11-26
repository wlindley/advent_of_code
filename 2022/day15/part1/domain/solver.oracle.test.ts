import { describe, expect, it } from 'vitest';
import { SensorReading } from '../../shared';
import { createPart1Solver } from './index';

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

function bruteForceExcludedOnRow(readings: readonly SensorReading[], targetY: number): bigint {
  if (readings.length === 0) return 0n;
  let minX = Infinity;
  let maxX = -Infinity;
  const beaconsOnRow = new Set<number>();
  for (const r of readings) {
    const rad = Number(r.radius);
    if (r.sensorX - rad < minX) minX = r.sensorX - rad;
    if (r.sensorX + rad > maxX) maxX = r.sensorX + rad;
    if (r.beaconY === targetY) beaconsOnRow.add(r.beaconX);
  }
  let count = 0n;
  for (let x = minX; x <= maxX; x += 1) {
    if (beaconsOnRow.has(x)) continue;
    if (readings.some((r) => r.covers(x, targetY))) {
      count += 1n;
    }
  }
  return count;
}

const EXAMPLE_READINGS = [
  new SensorReading(2, 18, -2, 15),
  new SensorReading(9, 16, 10, 16),
  new SensorReading(13, 2, 15, 3),
  new SensorReading(12, 14, 10, 16),
  new SensorReading(10, 20, 10, 16),
  new SensorReading(14, 17, 10, 16),
  new SensorReading(8, 7, 2, 10),
  new SensorReading(2, 0, 2, 10),
  new SensorReading(0, 11, 2, 10),
  new SensorReading(20, 14, 25, 17),
  new SensorReading(17, 20, 21, 22),
  new SensorReading(16, 7, 15, 3),
  new SensorReading(14, 3, 15, 3),
  new SensorReading(20, 1, 15, 3),
];

describe('Part 1 differential oracle', () => {
  it('matches point-by-point brute force across official example rows y in [-2..22]', () => {
    for (let y = -2; y <= 22; y += 1) {
      const fast = createPart1Solver(y).solve(EXAMPLE_READINGS);
      expect(fast).toBe(bruteForceExcludedOnRow(EXAMPLE_READINGS, y));
    }
  });

  it('matches brute force on degenerate edge cases', () => {
    const edgeCases: readonly (readonly [number, readonly SensorReading[]])[] = [
      [0, []],
      [5, [new SensorReading(2, 5, 2, 5)]],
      [5, [new SensorReading(0, 5, 4, 5), new SensorReading(2, 5, 4, 5), new SensorReading(6, 5, 4, 5)]],
    ];
    for (const [y, readings] of edgeCases) {
      expect(createPart1Solver(y).solve(readings)).toBe(bruteForceExcludedOnRow(readings, y));
    }
  });

  it('matches brute force across 60 seeded random sensor layouts', () => {
    const rng = new SeededRng(202215);
    for (let trial = 0; trial < 60; trial += 1) {
      const count = rng.nextInt(1, 8);
      const readings: SensorReading[] = [];
      for (let i = 0; i < count; i += 1) {
        readings.push(
          new SensorReading(
            rng.nextInt(-30, 30),
            rng.nextInt(-30, 30),
            rng.nextInt(-35, 35),
            rng.nextInt(-35, 35),
          ),
        );
      }
      const targetY = rng.nextInt(-25, 25);
      expect(createPart1Solver(targetY).solve(readings)).toBe(
        bruteForceExcludedOnRow(readings, targetY),
      );
    }
  });
});
