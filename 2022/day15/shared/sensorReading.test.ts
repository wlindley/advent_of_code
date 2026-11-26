import { describe, expect, it } from 'vitest';
import { assertSafeInteger, parseSensorReadings, SensorReading } from './sensorReading';

describe('assertSafeInteger', () => {
  it('accepts safe integers and rejects non-integers or unsafe values', () => {
    expect(() => assertSafeInteger(0, 'x')).not.toThrow();
    expect(() => assertSafeInteger(-42, 'x')).not.toThrow();
    expect(() => assertSafeInteger(1.5, 'x')).toThrow(RangeError);
    expect(() => assertSafeInteger(Number.NaN, 'x')).toThrow(RangeError);
    expect(() => assertSafeInteger(Number.MAX_SAFE_INTEGER + 1, 'x')).toThrow(RangeError);
  });
});

describe('SensorReading', () => {
  it('computes radius, freezes instance, and handles zero-radius reading', () => {
    const reading = new SensorReading(8, 7, 2, 10);
    expect(Object.isFrozen(reading)).toBe(true);
    expect(reading.radius).toBe(9n);

    const zero = new SensorReading(-5, 3, -5, 3);
    expect(zero.radius).toBe(0n);
    expect(zero.covers(-5, 3)).toBe(true);
    expect(zero.covers(-4, 3)).toBe(false);
    expect(zero.rowSlice(3)?.start).toBe(-5n);
    expect(zero.rowSlice(3)?.end).toBe(-5n);
    expect(zero.rowSlice(4)).toBeNull();
  });

  it('rejects non-safe-integer coordinates in constructor and methods', () => {
    expect(() => new SensorReading(1.2, 0, 0, 0)).toThrow(RangeError);
    expect(() => new SensorReading(0, Infinity, 0, 0)).toThrow(RangeError);
    expect(() => new SensorReading(0, 0, Number.MAX_SAFE_INTEGER + 1, 0)).toThrow(RangeError);
    expect(() => new SensorReading(0, 0, 0, Number.NaN)).toThrow(RangeError);

    const reading = new SensorReading(0, 0, 1, 0);
    expect(() => reading.covers(0.5, 0)).toThrow(RangeError);
    expect(() => reading.covers(0, -0.5)).toThrow(RangeError);
    expect(() => reading.rowSlice(1e16)).toThrow(RangeError);
  });

  it('checks coverage on inside, boundary, and outside points', () => {
    const reading = new SensorReading(2, 18, -2, 15); // radius = 7
    expect(reading.radius).toBe(7n);
    expect(reading.covers(2, 18)).toBe(true);
    expect(reading.covers(9, 18)).toBe(true);
    expect(reading.covers(-5, 18)).toBe(true);
    expect(reading.covers(2, 11)).toBe(true);
    expect(reading.covers(10, 18)).toBe(false);
    expect(reading.covers(5, 23)).toBe(false);
  });

  it('computes row slices at apex, center, and out-of-range rows', () => {
    const reading = new SensorReading(8, 7, 2, 10); // radius = 9
    expect(reading.rowSlice(-2)?.start).toBe(8n);
    expect(reading.rowSlice(-2)?.end).toBe(8n);
    expect(reading.rowSlice(7)?.start).toBe(-1n);
    expect(reading.rowSlice(7)?.end).toBe(17n);
    expect(reading.rowSlice(16)?.start).toBe(8n);
    expect(reading.rowSlice(16)?.end).toBe(8n);
    expect(reading.rowSlice(-3)).toBeNull();
    expect(reading.rowSlice(17)).toBeNull();
  });

  it('computes frozen outer diagonals at distance radius + 1', () => {
    const reading = new SensorReading(8, 7, 2, 10); // radius = 9, d = 10, sum = 15, diff = 1
    const diag = reading.outerDiagonals;
    expect(Object.isFrozen(diag)).toBe(true);
    expect(Object.isFrozen(diag.sumLines)).toBe(true);
    expect(Object.isFrozen(diag.diffLines)).toBe(true);
    expect(diag.sumLines).toEqual([5n, 25n]);
    expect(diag.diffLines).toEqual([-9n, 11n]);
  });

  it('preserves exact precision near ±5e15 via BigInt arithmetic', () => {
    const big = 5_000_000_000_000_000;
    const reading = new SensorReading(big, -big, -big, big);
    expect(reading.radius).toBe(20_000_000_000_000_000n);
    const slice = reading.rowSlice(0);
    expect(slice?.start).toBe(-10_000_000_000_000_000n);
    expect(slice?.end).toBe(20_000_000_000_000_000n);
    expect(reading.outerDiagonals.sumLines).toEqual([-20_000_000_000_000_001n, 20_000_000_000_000_001n]);
  });
});

describe('parseSensorReadings', () => {
  it('parses valid lines with CRLF and blank lines into a frozen array', () => {
    const raw = '\r\nSensor at x=2, y=18: closest beacon is at x=-2, y=15\r\n\r\nSensor at x=9, y=16: closest beacon is at x=10, y=16\r\n';
    const parsed = parseSensorReadings(raw);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ sensorX: 2, sensorY: 18, beaconX: -2, beaconY: 15 });
    expect(parsed[1]).toMatchObject({ sensorX: 9, sensorY: 16, beaconX: 10, beaconY: 16 });
  });

  it('rejects empty input, malformed lines, and non-safe integer coordinates', () => {
    expect(() => parseSensorReadings('')).toThrow();
    expect(() => parseSensorReadings('   \n \r\n ')).toThrow();
    expect(() => parseSensorReadings('Sensor at x=1, y=2')).toThrow();
    expect(() => parseSensorReadings('Sensor at x=99999999999999999, y=0: closest beacon is at x=0, y=0')).toThrow(RangeError);
  });
});
