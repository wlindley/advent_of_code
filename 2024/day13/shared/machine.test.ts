import { describe, expect, it } from 'vitest';
import { ClawMachine, parseClawMachines } from './machine';
import { ClawConfig, Vector2D } from './types';

describe('ClawMachine', () => {
  it('computes determinant, isCollinear, and targetPrize dynamically and freezes', () => {
    const m = new ClawMachine(new Vector2D(94n, 34n), new Vector2D(22n, 67n), new Vector2D(8400n, 5400n));
    expect(Object.isFrozen(m)).toBe(true);
    expect(m.determinant).toBe(5550n);
    expect(m.isCollinear).toBe(false);

    const target = m.targetPrize(new ClawConfig(10_000_000_000_000n, null));
    expect(target.x).toBe(10_000_000_008_400n);
    expect(target.y).toBe(10_000_000_005_400n);

    const collinear = new ClawMachine(new Vector2D(2n, 4n), new Vector2D(3n, 6n), new Vector2D(0n, 0n));
    expect(collinear.determinant).toBe(0n);
    expect(collinear.isCollinear).toBe(true);
  });

  it('rejects non-positive button deltas and negative prize coordinates', () => {
    const pos = new Vector2D(1n, 1n);
    expect(() => new ClawMachine(new Vector2D(0n, 1n), pos, pos)).toThrow(RangeError);
    expect(() => new ClawMachine(new Vector2D(1n, 0n), pos, pos)).toThrow(RangeError);
    expect(() => new ClawMachine(pos, new Vector2D(0n, 1n), pos)).toThrow(RangeError);
    expect(() => new ClawMachine(pos, new Vector2D(1n, -1n), pos)).toThrow(RangeError);
    expect(() => new ClawMachine(pos, pos, new Vector2D(-1n, 0n))).toThrow(RangeError);
    expect(() => new ClawMachine(pos, pos, new Vector2D(0n, -1n))).toThrow(RangeError);
  });
});

describe('parseClawMachines', () => {
  it('parses multiple machine blocks including CRLF line endings', () => {
    const raw = [
      'Button A: X+94, Y+34',
      'Button B: X+22, Y+67',
      'Prize: X=8400, Y=5400',
      '',
      'Button A: X+26, Y+66',
      'Button B: X+67, Y+21',
      'Prize: X=12748, Y=12176',
    ].join('\r\n');

    const machines = parseClawMachines(raw);
    expect(Object.isFrozen(machines)).toBe(true);
    expect(machines).toHaveLength(2);
    expect(machines[0]!.buttonA.x).toBe(94n);
    expect(machines[0]!.buttonB.y).toBe(67n);
    expect(machines[1]!.prize.x).toBe(12748n);
    expect(machines[1]!.prize.y).toBe(12176n);
  });

  it('rejects empty input, wrong block line count, malformed lines, and zero deltas', () => {
    expect(() => parseClawMachines('   \n\t ')).toThrow(/empty/i);
    expect(() => parseClawMachines('Button A: X+1, Y+2\nButton B: X+3, Y+4')).toThrow(/3 lines/);
    expect(() => parseClawMachines('Bad A\nButton B: X+3, Y+4\nPrize: X=5, Y=6')).toThrow(/Button A/);
    expect(() => parseClawMachines('Button A: X+1, Y+2\nBad B\nPrize: X=5, Y=6')).toThrow(/Button B/);
    expect(() => parseClawMachines('Button A: X+1, Y+2\nButton B: X+3, Y+4\nBad P')).toThrow(/Prize/);
    expect(() => parseClawMachines('Button A: X+0, Y+2\nButton B: X+3, Y+4\nPrize: X=5, Y=6')).toThrow(RangeError);
  });
});
