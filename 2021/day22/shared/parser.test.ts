import { describe, expect, it } from 'vitest';
import { parseRebootSteps } from './parser';

describe('parseRebootSteps', () => {
  it('parses valid on/off steps with negative, positive, and large bigint coordinates', () => {
    const raw = [
      'on x=-20..26,y=-36..17,z=-47..7',
      'off x=9..11,y=9..11,z=9..11',
      'on x=-99999999999999999999..99999999999999999999,y=0..0,z=-5..5',
    ].join('\n');

    const steps = parseRebootSteps(raw);
    expect(Object.isFrozen(steps)).toBe(true);
    expect(steps).toHaveLength(3);

    expect(steps[0]!.action).toBe('on');
    expect(steps[0]!.cuboid.x.start).toBe(-20n);
    expect(steps[0]!.cuboid.z.end).toBe(7n);

    expect(steps[1]!.action).toBe('off');
    expect(steps[1]!.cuboid.volume).toBe(27n);

    expect(steps[2]!.cuboid.x.start).toBe(-99999999999999999999n);
    expect(steps[2]!.cuboid.y.length).toBe(1n);
    expect(Object.isFrozen(steps[2])).toBe(true);
  });

  it('tolerates CRLF line endings and leading/trailing blank lines', () => {
    const raw = '\r\n  on x=1..2,y=3..4,z=5..6\r\noff x=-1..0,y=-2..0,z=-3..0\r\n\r\n';
    const steps = parseRebootSteps(raw);
    expect(steps).toHaveLength(2);
    expect(steps[0]!.action).toBe('on');
    expect(steps[1]!.action).toBe('off');
  });

  it('rejects empty inputs and interior blank lines', () => {
    expect(() => parseRebootSteps('')).toThrow(/empty/i);
    expect(() => parseRebootSteps('   \r\n  ')).toThrow(/empty/i);
    expect(() => parseRebootSteps('on x=1..2,y=3..4,z=5..6\n\noff x=0..0,y=0..0,z=0..0')).toThrow(
      /blank line/i,
    );
  });

  it('rejects malformed lines and inverted axis bounds', () => {
    expect(() => parseRebootSteps('toggle x=1..2,y=3..4,z=5..6')).toThrow(/Invalid reboot step/);
    expect(() => parseRebootSteps('on x=1..2,y=3..4')).toThrow(/Invalid reboot step/);
    expect(() => parseRebootSteps('on x=10..5,y=0..1,z=0..1')).toThrow(RangeError);
    expect(() => parseRebootSteps('off x=0..1,y=5..-1,z=0..1')).toThrow(RangeError);
    expect(() => parseRebootSteps('on x=0..1,y=0..1,z=2..1')).toThrow(RangeError);
  });
});
