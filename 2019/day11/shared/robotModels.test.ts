import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_ROBOT_STEPS,
  DEFAULT_MAX_VM_STEPS,
  HEADING_DELTAS,
  HullBounds,
  PaintingReport,
  panelKey,
  stepPosition,
  turnHeading,
  validateRobotLimits,
  type PaintedPanel,
} from './robotModels';

describe('robotModels', () => {
  it('turns headings left (0) and right (1) across all 4 cardinal directions', () => {
    expect(HEADING_DELTAS).toEqual([
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]);
    expect(turnHeading(0, 0)).toBe(3);
    expect(turnHeading(3, 0)).toBe(2);
    expect(turnHeading(2, 0)).toBe(1);
    expect(turnHeading(1, 0)).toBe(0);

    expect(turnHeading(0, 1)).toBe(1);
    expect(turnHeading(1, 1)).toBe(2);
    expect(turnHeading(2, 1)).toBe(3);
    expect(turnHeading(3, 1)).toBe(0);
  });

  it('steps positions according to heading deltas', () => {
    expect(stepPosition(2, -3, 0)).toEqual({ x: 2, y: -4 });
    expect(stepPosition(2, -3, 1)).toEqual({ x: 3, y: -3 });
    expect(stepPosition(2, -3, 2)).toEqual({ x: 2, y: -2 });
    expect(stepPosition(2, -3, 3)).toEqual({ x: 1, y: -3 });
  });

  it('expands HullBounds and computes width and height dynamically', () => {
    const origin = HullBounds.empty();
    expect(origin.width).toBe(1);
    expect(origin.height).toBe(1);

    const expanded = origin.expand(-2, 3).expand(4, -1);
    expect(expanded.minX).toBe(-2);
    expect(expanded.maxX).toBe(4);
    expect(expanded.minY).toBe(-1);
    expect(expanded.maxY).toBe(3);
    expect(expanded.width).toBe(7);
    expect(expanded.height).toBe(5);
  });

  it('computes PaintingReport counts, colors, and whitePanels for startPanelColor 0 and 1', () => {
    const panels = new Map<string, PaintedPanel>([
      [panelKey(1, 0), { x: 1, y: 0, color: 1, paintCount: 2 }],
      [panelKey(2, 0), { x: 2, y: 0, color: 0, paintCount: 1 }],
    ]);

    const part1Report = new PaintingReport(0, panels, { x: 2, y: 0 }, 1, 3, 21);
    expect(part1Report.paintedCount).toBe(2);
    expect(part1Report.colorAt(0, 0)).toBe(0);
    expect(part1Report.colorAt(1, 0)).toBe(1);
    expect(part1Report.colorAt(2, 0)).toBe(0);
    expect(part1Report.colorAt(9, 9)).toBe(0);
    expect(part1Report.paintCountAt(1, 0)).toBe(2);
    expect(part1Report.paintCountAt(9, 9)).toBe(0);
    expect(part1Report.whitePanels).toEqual([{ x: 1, y: 0 }]);

    const part2UnpaintedOrigin = new PaintingReport(1, panels, { x: 2, y: 0 }, 1, 3, 21);
    expect(part2UnpaintedOrigin.colorAt(0, 0)).toBe(1);
    expect(part2UnpaintedOrigin.whitePanels).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ]);

    const panelsWithBlackOrigin = new Map<string, PaintedPanel>([
      [panelKey(0, 0), { x: 0, y: 0, color: 0, paintCount: 1 }],
      [panelKey(1, 0), { x: 1, y: 0, color: 1, paintCount: 1 }],
    ]);
    const part2PaintedOrigin = new PaintingReport(1, panelsWithBlackOrigin, { x: 1, y: 0 }, 1, 2, 14);
    expect(part2PaintedOrigin.colorAt(0, 0)).toBe(0);
    expect(part2PaintedOrigin.whitePanels).toEqual([{ x: 1, y: 0 }]);
  });

  it('validates positive integer robot execution limits', () => {
    expect(validateRobotLimits({ maxVmSteps: DEFAULT_MAX_VM_STEPS, maxRobotSteps: DEFAULT_MAX_ROBOT_STEPS })).toEqual({
      maxVmSteps: DEFAULT_MAX_VM_STEPS,
      maxRobotSteps: DEFAULT_MAX_ROBOT_STEPS,
    });
    expect(() => validateRobotLimits({ maxVmSteps: 0, maxRobotSteps: 10 })).toThrow(RangeError);
    expect(() => validateRobotLimits({ maxVmSteps: 1.5, maxRobotSteps: 10 })).toThrow(RangeError);
    expect(() => validateRobotLimits({ maxVmSteps: 10, maxRobotSteps: 0 })).toThrow(RangeError);
    expect(() => validateRobotLimits({ maxVmSteps: 10, maxRobotSteps: -2 })).toThrow(RangeError);
  });
});
