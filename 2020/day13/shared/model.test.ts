import { describe, expect, it } from 'vitest';
import { BusEntry, BusSchedule, parseBusSchedule } from './model';

describe('BusEntry', () => {
  it('computes wait, next departure, congruence, and offset departure', () => {
    const bus0 = new BusEntry(7n, 0n);
    expect(Object.isFrozen(bus0)).toBe(true);
    expect(bus0.waitFrom(0n)).toBe(0n);
    expect(bus0.waitFrom(939n)).toBe(6n);
    expect(bus0.nextDepartureFrom(939n)).toBe(945n);
    expect(bus0.congruence).toEqual({ remainder: 0n, modulus: 7n });

    const bus1 = new BusEntry(13n, 1n);
    expect(bus1.congruence).toEqual({ remainder: 12n, modulus: 13n });
    expect(bus1.departsWithOffsetAt(1068781n)).toBe(true);
    expect(bus1.departsWithOffsetAt(1068782n)).toBe(false);

    const busWrapped = new BusEntry(7n, 7n);
    expect(busWrapped.congruence).toEqual({ remainder: 0n, modulus: 7n });
    const busShifted = new BusEntry(7n, 10n);
    expect(busShifted.congruence).toEqual({ remainder: 4n, modulus: 7n });
  });

  it('handles exact zero wait and huge BigInt timestamps', () => {
    const bus = new BusEntry(59n, 4n);
    expect(bus.waitFrom(944n)).toBe(0n);
    expect(bus.nextDepartureFrom(944n)).toBe(944n);

    const huge = 10n ** 30n;
    const wait = bus.waitFrom(huge);
    expect(wait).toBe((59n - (huge % 59n)) % 59n);
    expect(bus.nextDepartureFrom(huge) % 59n).toBe(0n);
  });

  it('rejects non-positive id and negative offset or timestamp', () => {
    expect(() => new BusEntry(0n, 0n)).toThrow(RangeError);
    expect(() => new BusEntry(-5n, 0n)).toThrow(RangeError);
    expect(() => new BusEntry(7n, -1n)).toThrow(RangeError);

    const bus = new BusEntry(7n, 0n);
    expect(() => bus.waitFrom(-1n)).toThrow(RangeError);
    expect(() => bus.nextDepartureFrom(-1n)).toThrow(RangeError);
    expect(() => bus.departsWithOffsetAt(-1n)).toThrow(RangeError);
  });
});

describe('BusSchedule', () => {
  it('stores validated buses and derives counts and congruences', () => {
    const buses = [new BusEntry(7n, 0n), new BusEntry(13n, 1n), new BusEntry(59n, 4n)];
    const schedule = new BusSchedule(939n, buses, 5);
    expect(Object.isFrozen(schedule)).toBe(true);
    expect(schedule.earliestTimestamp).toBe(939n);
    expect(schedule.slotCount).toBe(5);
    expect(schedule.activeCount).toBe(3);
    expect(schedule.inactiveCount).toBe(2);
    expect(schedule.congruences).toEqual([
      { remainder: 0n, modulus: 7n },
      { remainder: 12n, modulus: 13n },
      { remainder: 55n, modulus: 59n },
    ]);
  });

  it('rejects invalid timestamps, empty buses, bad slotCount, or invalid offsets', () => {
    const b0 = new BusEntry(7n, 0n);
    const b1 = new BusEntry(13n, 1n);
    expect(() => new BusSchedule(-1n, [b0], 1)).toThrow(RangeError);
    expect(() => new BusSchedule(0n, [], 1)).toThrow(RangeError);
    expect(() => new BusSchedule(0n, [b0, b1], 1)).toThrow(RangeError);
    expect(() => new BusSchedule(0n, [b0], 1.5)).toThrow(RangeError);
    expect(() => new BusSchedule(0n, [b0, new BusEntry(13n, 0n)], 2)).toThrow(RangeError);
    expect(() => new BusSchedule(0n, [b1, b0], 2)).toThrow(RangeError);
    expect(() => new BusSchedule(0n, [new BusEntry(7n, 2n)], 2)).toThrow(RangeError);
  });
});

describe('parseBusSchedule', () => {
  it('parses official example, CRLF, leading x, and t0 = 0', () => {
    const ex = parseBusSchedule('939\n7,13,x,x,59,x,31,19\n');
    expect(ex.earliestTimestamp).toBe(939n);
    expect(ex.slotCount).toBe(8);
    expect(ex.activeCount).toBe(5);
    expect(ex.inactiveCount).toBe(3);
    expect(ex.buses.map((b) => [b.id, b.offset])).toEqual([
      [7n, 0n],
      [13n, 1n],
      [59n, 4n],
      [31n, 6n],
      [19n, 7n],
    ]);

    const leadingX = parseBusSchedule('  0 \r\n x, 17, x, 13  ');
    expect(leadingX.earliestTimestamp).toBe(0n);
    expect(leadingX.slotCount).toBe(4);
    expect(leadingX.buses.map((b) => [b.id, b.offset])).toEqual([
      [17n, 1n],
      [13n, 3n],
    ]);
  });

  it('rejects malformed schedules', () => {
    expect(() => parseBusSchedule('')).toThrow();
    expect(() => parseBusSchedule('939')).toThrow();
    expect(() => parseBusSchedule('939\n7,13\n42')).toThrow();
    expect(() => parseBusSchedule('abc\n7,13')).toThrow();
    expect(() => parseBusSchedule('-5\n7,13')).toThrow();
    expect(() => parseBusSchedule('939\n7,0,13')).toThrow();
    expect(() => parseBusSchedule('939\n7,X,13')).toThrow();
    expect(() => parseBusSchedule('939\n7,')).toThrow();
    expect(() => parseBusSchedule('939\nx,x')).toThrow();
  });
});
