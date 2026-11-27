import { describe, expect, it } from 'vitest';
import {
  ArcadeReport,
  DEFAULT_ARCADE_LIMITS,
  DEFAULT_MAX_INPUT_TURNS,
  DEFAULT_MAX_VM_STEPS,
  ScreenBounds,
  chooseJoystickTilt,
  countBlocks,
  tileKey,
  validateArcadeLimits,
  type ScreenTile,
} from './arcadeModels';

describe('arcadeModels', () => {
  it('computes tile keys and counts block tiles dynamically', () => {
    expect(tileKey(3, 7)).toBe('3,7');
    const tiles = new Map<string, ScreenTile>([
      [tileKey(0, 0), { x: 0, y: 0, id: 1 }],
      [tileKey(1, 0), { x: 1, y: 0, id: 2 }],
      [tileKey(2, 0), { x: 2, y: 0, id: 2 }],
      [tileKey(3, 1), { x: 3, y: 1, id: 3 }],
      [tileKey(4, 1), { x: 4, y: 1, id: 4 }],
    ]);
    expect(countBlocks(tiles)).toBe(2);
    expect(countBlocks(new Map())).toBe(0);
  });

  it('chooses joystick tilt toward ball x or neutral when aligned or missing', () => {
    expect(chooseJoystickTilt(null, 5)).toBe(0);
    expect(chooseJoystickTilt(5, null)).toBe(0);
    expect(chooseJoystickTilt(5, 5)).toBe(0);
    expect(chooseJoystickTilt(7, 5)).toBe(1);
    expect(chooseJoystickTilt(3, 5)).toBe(-1);
  });

  it('expands frozen ScreenBounds and derives width and height', () => {
    const empty = ScreenBounds.empty();
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty.width).toBe(1);
    expect(empty.height).toBe(1);

    const expanded = empty.expand(4, 2).expand(-1, 5);
    expect(expanded.minX).toBe(-1);
    expect(expanded.maxX).toBe(4);
    expect(expanded.minY).toBe(0);
    expect(expanded.maxY).toBe(5);
    expect(expanded.width).toBe(6);
    expect(expanded.height).toBe(6);
  });

  it('computes ArcadeReport blockCount, bounds, and tileAt for empty and populated screens', () => {
    const emptyReport = new ArcadeReport(new Map(), 0, 0, 5, 0);
    expect(Object.isFrozen(emptyReport)).toBe(true);
    expect(emptyReport.blockCount).toBe(0);
    expect(emptyReport.bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    expect(emptyReport.tileAt(0, 0)).toBe(0);

    const tiles = new Map<string, ScreenTile>([
      [tileKey(2, 1), { x: 2, y: 1, id: 2 }],
      [tileKey(6, 4), { x: 6, y: 4, id: 4 }],
    ]);
    const report = new ArcadeReport(tiles, 150, 12, 400, 2);
    expect(report.score).toBe(150);
    expect(report.inputTurns).toBe(12);
    expect(report.vmSteps).toBe(400);
    expect(report.drawCount).toBe(2);
    expect(report.blockCount).toBe(1);
    expect(report.bounds).toEqual({ minX: 2, maxX: 6, minY: 1, maxY: 4 });
    expect(report.tileAt(2, 1)).toBe(2);
    expect(report.tileAt(6, 4)).toBe(4);
    expect(report.tileAt(0, 0)).toBe(0);
  });

  it('validates positive integer arcade execution limits and freezes defaults', () => {
    expect(Object.isFrozen(DEFAULT_ARCADE_LIMITS)).toBe(true);
    expect(validateArcadeLimits({ maxVmSteps: DEFAULT_MAX_VM_STEPS, maxInputTurns: DEFAULT_MAX_INPUT_TURNS })).toEqual(
      DEFAULT_ARCADE_LIMITS,
    );
    expect(() => validateArcadeLimits({ maxVmSteps: 0, maxInputTurns: 10 })).toThrow(RangeError);
    expect(() => validateArcadeLimits({ maxVmSteps: 1.5, maxInputTurns: 10 })).toThrow(RangeError);
    expect(() => validateArcadeLimits({ maxVmSteps: 10, maxInputTurns: 0 })).toThrow(RangeError);
    expect(() => validateArcadeLimits({ maxVmSteps: 10, maxInputTurns: -3 })).toThrow(RangeError);
  });
});
