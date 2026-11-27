import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PAINTED_COUNT_POLICY,
  PaintingRobotSolver,
  REGISTRATION_ID_POLICY,
  executePaintingRobot,
  tracePaintingRobot,
} from './robotRunner';

const OFFICIAL_EXAMPLE =
  '3,43,104,1,104,0,3,43,104,0,104,0,3,43,104,1,104,0,3,43,104,1,104,0,3,43,104,0,104,1,3,43,104,1,104,0,3,43,104,1,104,0,99,0';

function buildFixedRouteProgram(steps: readonly (readonly [0 | 1, 0 | 1])[]): string {
  const scratch = steps.length * 6 + 1;
  const cells: number[] = [];
  for (const [color, turn] of steps) {
    cells.push(3, scratch, 104, color, 104, turn);
  }
  cells.push(99, 0);
  return cells.join(',');
}

describe('robotRunner', () => {
  it('executes the 7-step official walkthrough with 6 painted panels and 4 white panels', () => {
    const program = parseIntcodeProgram(OFFICIAL_EXAMPLE);
    const report = executePaintingRobot(program, 0);

    expect(report.paintedCount).toBe(6);
    expect(report.robotSteps).toBe(7);
    expect(report.finalPosition).toEqual({ x: 0, y: -1 });
    expect(report.finalHeading).toBe(3);
    expect(report.paintCountAt(0, 0)).toBe(2);
    expect(report.colorAt(0, 0)).toBe(0);
    expect(report.whitePanels).toHaveLength(4);
    expect(PAINTED_COUNT_POLICY.extractAnswer(report)).toBe(6);
  });

  it('reacts to camera input when startPanelColor differs (0 vs 1)', () => {
    const reactive = parseIntcodeProgram(
      '3,22,1005,22,11,104,1,104,1,99,0,104,0,104,0,3,22,104,1,104,1,99,0',
    );
    const fromBlack = executePaintingRobot(reactive, 0);
    const fromWhite = executePaintingRobot(reactive, 1);

    expect(fromBlack.robotSteps).toBe(1);
    expect(fromBlack.finalPosition).toEqual({ x: 1, y: 0 });
    expect(fromBlack.finalHeading).toBe(1);

    expect(fromWhite.robotSteps).toBe(2);
    expect(fromWhite.finalPosition).toEqual({ x: -1, y: -1 });
    expect(fromWhite.finalHeading).toBe(0);
  });

  it('decodes synthetic Part 2 registration output via REGISTRATION_ID_POLICY', () => {
    const lSteps: readonly (readonly [0 | 1, 0 | 1])[] = [
      [1, 1], [0, 1], [0, 1], [1, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 0], [0, 1],
      [1, 1], [1, 1], [1, 1], [0, 1], [1, 0], [1, 0], [0, 1], [0, 1], [1, 0],
    ];
    const solver = new PaintingRobotSolver(REGISTRATION_ID_POLICY);
    expect(solver.policy.showRegistrationBanner).toBe(true);
    const parsed = solver.parse(buildFixedRouteProgram(lSteps));
    expect(solver.solve(parsed)).toBe('L');
  });

  it('handles immediate halt (99) and trailing IN -> HALT gracefully', () => {
    const immediate = executePaintingRobot(parseIntcodeProgram('99'), 0);
    expect(immediate.paintedCount).toBe(0);
    expect(immediate.robotSteps).toBe(0);
    expect(immediate.finalPosition).toEqual({ x: 0, y: 0 });

    const trailingInput = executePaintingRobot(parseIntcodeProgram('3,10,104,1,104,0,3,10,99,0,0'), 0);
    expect(trailingInput.paintedCount).toBe(1);
    expect(trailingInput.robotSteps).toBe(1);
    expect(trailingInput.finalPosition).toEqual({ x: -1, y: 0 });
  });

  it('rejects all protocol and safety-limit violations', () => {
    expect(() => executePaintingRobot(parseIntcodeProgram('104,1,99'), 0)).toThrow(Error);
    expect(() => executePaintingRobot(parseIntcodeProgram('3,5,104,1,99,0'), 0)).toThrow(Error);
    expect(() => executePaintingRobot(parseIntcodeProgram('3,9,104,1,104,0,104,1,99,0'), 0)).toThrow(Error);
    expect(() => executePaintingRobot(parseIntcodeProgram('3,7,104,2,104,0,99,0'), 0)).toThrow(Error);
    expect(() => executePaintingRobot(parseIntcodeProgram('3,7,104,1,104,2,99,0'), 0)).toThrow(Error);

    const example = parseIntcodeProgram(OFFICIAL_EXAMPLE);
    expect(() => executePaintingRobot(example, 0, { maxVmSteps: 100, maxRobotSteps: 3 })).toThrow(RangeError);
    expect(() => executePaintingRobot(example, 0, { maxVmSteps: 2, maxRobotSteps: 100 })).toThrow(RangeError);
  });

  it('produces bounded trace frames for maxSteps = 1, < total, >= total, and invalid limits', () => {
    const solver = new PaintingRobotSolver(PAINTED_COUNT_POLICY);
    const program = solver.parse(OFFICIAL_EXAMPLE);

    const defaultFrames = solver.trace(program);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(defaultFrames).toHaveLength(8);
    expect(defaultFrames[0]!.stepIndex).toBe(0);
    expect(defaultFrames[0]!.lastPaintColor).toBeNull();
    expect(defaultFrames[7]!.stepIndex).toBe(7);

    const single = solver.trace(program, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.stepIndex).toBe(7);

    const sampled = solver.trace(program, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[3]!.stepIndex).toBe(7);

    const immediate = tracePaintingRobot(parseIntcodeProgram('99'), 1, 5, { maxVmSteps: 100, maxRobotSteps: 10 });
    expect(immediate).toHaveLength(1);
    expect(immediate[0]!.startPanelColor).toBe(1);

    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
