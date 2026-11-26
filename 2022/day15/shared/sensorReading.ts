import { ClosedInterval } from '../../../shared/core';

const READING_RE =
  /^Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)$/;

/** Validates that a coordinate is an exact IEEE-754 safe integer. */
export function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}

function absBig(n: bigint): bigint {
  return n < 0n ? -n : n;
}

/** Outer bounding diagonal lines (`x + y = c` and `x - y = c`) at distance `radius + 1`. */
export interface OuterDiagonals {
  readonly sumLines: readonly [bigint, bigint];
  readonly diffLines: readonly [bigint, bigint];
}

/** Immutable sensor-to-nearest-beacon observation with exact BigInt Manhattan geometry. */
export class SensorReading {
  readonly sensorX: number;
  readonly sensorY: number;
  readonly beaconX: number;
  readonly beaconY: number;

  constructor(sensorX: number, sensorY: number, beaconX: number, beaconY: number) {
    assertSafeInteger(sensorX, 'sensorX');
    assertSafeInteger(sensorY, 'sensorY');
    assertSafeInteger(beaconX, 'beaconX');
    assertSafeInteger(beaconY, 'beaconY');
    this.sensorX = sensorX;
    this.sensorY = sensorY;
    this.beaconX = beaconX;
    this.beaconY = beaconY;
    Object.freeze(this);
  }

  get radius(): bigint {
    return (
      absBig(BigInt(this.sensorX) - BigInt(this.beaconX)) +
      absBig(BigInt(this.sensorY) - BigInt(this.beaconY))
    );
  }

  covers(x: number, y: number): boolean {
    assertSafeInteger(x, 'x');
    assertSafeInteger(y, 'y');
    const dist =
      absBig(BigInt(this.sensorX) - BigInt(x)) +
      absBig(BigInt(this.sensorY) - BigInt(y));
    return dist <= this.radius;
  }

  rowSlice(targetY: number): ClosedInterval | null {
    assertSafeInteger(targetY, 'targetY');
    const reach = this.radius - absBig(BigInt(targetY) - BigInt(this.sensorY));
    if (reach < 0n) return null;
    const sx = BigInt(this.sensorX);
    return new ClosedInterval(sx - reach, sx + reach);
  }

  get outerDiagonals(): OuterDiagonals {
    const d = this.radius + 1n;
    const sx = BigInt(this.sensorX);
    const sy = BigInt(this.sensorY);
    const sum = sx + sy;
    const diff = sx - sy;
    return Object.freeze({
      sumLines: Object.freeze([sum - d, sum + d] as const),
      diffLines: Object.freeze([diff - d, diff + d] as const),
    });
  }
}

/** Parses sensor report lines into a frozen array of validated `SensorReading` objects. */
export function parseSensorReadings(raw: string): readonly SensorReading[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const readings: SensorReading[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const match = READING_RE.exec(trimmed);
    if (!match) {
      throw new Error(`Invalid sensor reading line: ${trimmed}`);
    }
    readings.push(
      new SensorReading(
        Number(match[1]!),
        Number(match[2]!),
        Number(match[3]!),
        Number(match[4]!),
      ),
    );
  }
  if (readings.length === 0) {
    throw new Error('Input must contain at least one sensor reading');
  }
  return Object.freeze(readings);
}
