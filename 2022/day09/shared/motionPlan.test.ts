import { describe, expect, it } from 'vitest';
import { GridBounds, GridPoint, MOVE_DIRECTION, MotionCommand, MotionPlan, type MoveDirection } from './motionPlan';

describe('MOVE_DIRECTION and GridPoint', () => {
  it('exposes frozen cardinal directions and origin', () => {
    expect(Object.isFrozen(MOVE_DIRECTION)).toBe(true);
    expect(MOVE_DIRECTION).toEqual({ U: 'U', D: 'D', L: 'L', R: 'R' });
    expect(Object.isFrozen(GridPoint.ORIGIN)).toBe(true);
    expect(GridPoint.ORIGIN.x).toBe(0);
    expect(GridPoint.ORIGIN.y).toBe(0);
  });

  it('compares points by coordinates and freezes instances', () => {
    const p = new GridPoint(3, -4);
    expect(Object.isFrozen(p)).toBe(true);
    expect(p.equals(new GridPoint(3, -4))).toBe(true);
    expect(p.equals(new GridPoint(2, -4))).toBe(false);
    expect(p.equals(new GridPoint(3, -5))).toBe(false);
  });

  it('rejects non-safe-integer coordinates', () => {
    expect(() => new GridPoint(1.5, 0)).toThrow(RangeError);
    expect(() => new GridPoint(0, Number.NaN)).toThrow(RangeError);
    expect(() => new GridPoint(Number.MAX_SAFE_INTEGER + 1, 0)).toThrow(RangeError);
  });
});

describe('GridBounds', () => {
  it('computes derived width, height, and area and freezes instances', () => {
    const b = new GridBounds(-2, 3, -1, 4);
    expect(Object.isFrozen(b)).toBe(true);
    expect(b.width).toBe(6);
    expect(b.height).toBe(6);
    expect(b.area).toBe(36);
  });

  it('rejects non-integers and inverted min/max bounds', () => {
    expect(() => new GridBounds(0.5, 1, 0, 1)).toThrow(RangeError);
    expect(() => new GridBounds(0, 1, 0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => new GridBounds(2, 1, 0, 1)).toThrow(RangeError);
    expect(() => new GridBounds(0, 1, 3, 2)).toThrow(RangeError);
  });
});

describe('MotionCommand', () => {
  it('maps each direction to Y-up deltas and freezes instances', () => {
    const cases: readonly [MoveDirection, number, number][] = [
      [MOVE_DIRECTION.U, 0, 1],
      [MOVE_DIRECTION.D, 0, -1],
      [MOVE_DIRECTION.L, -1, 0],
      [MOVE_DIRECTION.R, 1, 0],
    ];
    for (const [dir, dx, dy] of cases) {
      const cmd = new MotionCommand(dir, 5);
      expect(Object.isFrozen(cmd)).toBe(true);
      expect(cmd.dx).toBe(dx);
      expect(cmd.dy).toBe(dy);
    }
  });

  it('parses valid commands and rejects malformed lines', () => {
    const cmd = MotionCommand.parse('U 12', 3);
    expect(cmd.direction).toBe('U');
    expect(cmd.steps).toBe(12);

    expect(() => MotionCommand.parse('X 4', 1)).toThrow(/line 1/i);
    expect(() => MotionCommand.parse('R 0', 2)).toThrow(/line 2/i);
    expect(() => MotionCommand.parse('L -3', 3)).toThrow(/line 3/i);
    expect(() => MotionCommand.parse('D 04', 4)).toThrow(/line 4/i);
    expect(() => MotionCommand.parse('U4', 5)).toThrow(/line 5/i);
    expect(() => MotionCommand.parse('R 9007199254740992', 6)).toThrow(RangeError);
  });

  it('rejects invalid constructor arguments', () => {
    expect(() => new MotionCommand('X' as MoveDirection, 1)).toThrow(Error);
    expect(() => new MotionCommand('R', 0)).toThrow(RangeError);
    expect(() => new MotionCommand('R', 1.5)).toThrow(RangeError);
  });
});

describe('MotionPlan', () => {
  it('normalizes CRLF, strips outer newlines, and computes derived metrics', () => {
    const plan = MotionPlan.parse('\n\r\nR 4\r\nU 4\r\nL 3\r\nD 1\n\n');
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.commands)).toBe(true);
    expect(plan.commandCount).toBe(4);
    expect(plan.totalSteps).toBe(12);
    expect(plan.computeBounds()).toEqual(new GridBounds(0, 4, 0, 4));
  });

  it('includes origin and negative excursions in computeBounds', () => {
    const plan = MotionPlan.parse('L 5\nD 3\nR 2');
    expect(plan.computeBounds()).toEqual(new GridBounds(-5, 0, -3, 0));
  });

  it('rejects empty plans, internal blank lines, and empty command arrays', () => {
    expect(() => new MotionPlan([])).toThrow(RangeError);
    expect(() => MotionPlan.parse('')).toThrow(Error);
    expect(() => MotionPlan.parse('\n\r\n')).toThrow(Error);
    expect(() => MotionPlan.parse('R 2\n\nU 1')).toThrow(/line 2/i);
    expect(() => MotionPlan.parse('R 2\n   \nU 1')).toThrow(/line 2/i);
  });
});
