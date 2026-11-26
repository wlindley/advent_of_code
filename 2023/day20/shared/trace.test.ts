import { describe, expect, it } from 'vitest';
import { parseCircuitBlueprint } from './parser';
import { buildPulseTrace, DEFAULT_MAX_TRACE_STEPS } from './trace';

const EXAMPLE_2 = [
  'broadcaster -> a',
  '%a -> inv, con',
  '&inv -> b',
  '%b -> con',
  '&con -> output',
].join('\n');

describe('day20 buildPulseTrace', () => {
  it('captures initial idle frame and every pulse step when within DEFAULT_MAX_TRACE_STEPS', () => {
    const bp = parseCircuitBlueprint(EXAMPLE_2);
    const frames = buildPulseTrace(bp, 4);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    // Example 2 emits 8 + 6 + 8 + 6 = 28 pulses across 4 presses, plus 1 initial frame = 29.
    expect(frames).toHaveLength(29);
    expect(frames[0]).toMatchObject({
      stepIndex: 0,
      totalRawSteps: 29,
      press: 0,
      activePulse: null,
      lowTotal: 0,
      highTotal: 0,
      highlightedNodes: [],
    });
    const last = frames[frames.length - 1]!;
    expect(last.stepIndex).toBe(28);
    expect(last.press).toBe(4);
    expect(last.lowTotal).toBe(17);
    expect(last.highTotal).toBe(11);
    expect(last.activePulse?.press).toBe(4);
    expect(last.highlightedNodes).toEqual([last.activePulse!.from, last.activePulse!.to]);
    expect(last.caption).toContain('Press 4:');
  });

  it('uniformly samples down to maxSteps preserving start and end frames', () => {
    const bp = parseCircuitBlueprint(EXAMPLE_2);
    const sampled = buildPulseTrace(bp, 4, { maxSteps: 6 });
    expect(sampled).toHaveLength(6);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[5]?.stepIndex).toBe(28);
    expect(sampled[5]?.lowTotal).toBe(17);
    expect(sampled[5]?.highTotal).toBe(11);
  });

  it('supports maxSteps = 1 returning only the terminal frame', () => {
    const bp = parseCircuitBlueprint(EXAMPLE_2);
    const single = buildPulseTrace(bp, 4, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.stepIndex).toBe(28);
    expect(single[0]?.press).toBe(4);
  });

  it('rejects invalid pressCount or invalid maxSteps', () => {
    const bp = parseCircuitBlueprint(EXAMPLE_2);
    expect(() => buildPulseTrace(bp, 0)).toThrow(RangeError);
    expect(() => buildPulseTrace(bp, 1, { maxSteps: 0 })).toThrow(RangeError);
  });
});
