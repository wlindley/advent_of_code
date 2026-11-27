import { describe, expect, it } from 'vitest';
import { NavigationInstruction, parseNavigationInstructions, ShipState, Vec2 } from './model';
import { HEADING_NAVIGATION_RULE, WAYPOINT_NAVIGATION_RULE } from './rules';
import { DEFAULT_MAX_TRACE_STEPS, NavigationTraceFrame, traceNavigation } from './trace';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');

describe('2020 Day 12 shared trace', () => {
  it('validates NavigationTraceFrame invariants and computes isFinal', () => {
    const initialState = ShipState.initial(new Vec2(1n, 0n));
    const inst = new NavigationInstruction('F', 10n);
    const frame0 = new NavigationTraceFrame(0, 2, null, initialState);
    expect(frame0.stepIndex).toBe(0);
    expect(frame0.totalSteps).toBe(2);
    expect(frame0.instruction).toBeNull();
    expect(frame0.state).toBe(initialState);
    expect(frame0.isFinal).toBe(false);

    const frameFinal = new NavigationTraceFrame(2, 2, inst, initialState);
    expect(frameFinal.isFinal).toBe(true);

    expect(() => new NavigationTraceFrame(-1, 2, null, initialState)).toThrow(RangeError);
    expect(() => new NavigationTraceFrame(0.5, 2, null, initialState)).toThrow(RangeError);
    expect(() => new NavigationTraceFrame(2, 1, inst, initialState)).toThrow(RangeError);
    expect(() => new NavigationTraceFrame(1, 2.5, inst, initialState)).toThrow(RangeError);
    expect(() => new NavigationTraceFrame(0, 2, inst, initialState)).toThrow(Error);
    expect(() => new NavigationTraceFrame(1, 2, null, initialState)).toThrow(Error);
  });

  it('produces a full trace for the official example', () => {
    const instructions = parseNavigationInstructions(EXAMPLE_INPUT);
    const frames = traceNavigation(instructions, HEADING_NAVIGATION_RULE, DEFAULT_MAX_TRACE_STEPS);
    expect(frames).toHaveLength(6);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.instruction).toBeNull();
    expect(frames[0]!.isFinal).toBe(false);
    expect(frames[5]!.stepIndex).toBe(5);
    expect(frames[5]!.instruction?.label).toBe('F11');
    expect(frames[5]!.state.manhattanDistance).toBe(25n);
    expect(frames[5]!.isFinal).toBe(true);
  });

  it('downsamples traces while preserving endpoints and handles maxSteps = 1', () => {
    const instructions = parseNavigationInstructions(EXAMPLE_INPUT);

    const sampled3 = traceNavigation(instructions, WAYPOINT_NAVIGATION_RULE, 3);
    expect(sampled3.map((f) => f.stepIndex)).toEqual([0, 3, 5]);
    expect(sampled3[0]!.instruction).toBeNull();
    expect(sampled3[2]!.state.manhattanDistance).toBe(286n);
    expect(sampled3[2]!.isFinal).toBe(true);

    const onlyFinal = traceNavigation(instructions, HEADING_NAVIGATION_RULE, 1);
    expect(onlyFinal).toHaveLength(1);
    expect(onlyFinal[0]!.stepIndex).toBe(5);
    expect(onlyFinal[0]!.state.manhattanDistance).toBe(25n);
    expect(onlyFinal[0]!.isFinal).toBe(true);
  });

  it('handles empty instructions and rejects invalid maxSteps', () => {
    const emptyFrames = traceNavigation([], HEADING_NAVIGATION_RULE, DEFAULT_MAX_TRACE_STEPS);
    expect(emptyFrames).toHaveLength(1);
    expect(emptyFrames[0]!.stepIndex).toBe(0);
    expect(emptyFrames[0]!.totalSteps).toBe(0);
    expect(emptyFrames[0]!.isFinal).toBe(true);

    const instructions = parseNavigationInstructions(EXAMPLE_INPUT);
    expect(() => traceNavigation(instructions, HEADING_NAVIGATION_RULE, 0)).toThrow(RangeError);
    expect(() => traceNavigation(instructions, HEADING_NAVIGATION_RULE, -3)).toThrow(RangeError);
    expect(() => traceNavigation(instructions, HEADING_NAVIGATION_RULE, 1.5)).toThrow(RangeError);
  });
});
