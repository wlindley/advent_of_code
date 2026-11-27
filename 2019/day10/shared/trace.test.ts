import { describe, expect, it } from 'vitest';
import { AsteroidMap } from './asteroidMap';
import {
  buildMonitorScanTrace,
  buildVaporizationTrace,
  DEFAULT_MAX_TRACE_FRAMES,
} from './trace';

const EX1 = ['.#..#', '.....', '#####', '....#', '...##'].join('\n');

describe('buildMonitorScanTrace', () => {
  it('traces all candidates with running best and derived getters when within maxSteps', () => {
    const map = AsteroidMap.parse(EX1);
    const frames = buildMonitorScanTrace(map);
    expect(frames).toHaveLength(map.asteroidCount);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.kind).toBe('monitor-scan');
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.isNewBest).toBe(true);
    expect(frames[0]!.isFinalStep).toBe(false);
    expect(frames[0]!.detectedCount).toBe(frames[0]!.visibleTargets.length);

    const last = frames[frames.length - 1]!;
    expect(last.isFinalStep).toBe(true);
    expect(last.bestStation).toEqual({ x: 3, y: 4 });
    expect(last.bestDetectedCount).toBe(8);
    expect(last.minDetectedCount).toBeLessThan(8);
    expect(last.maxDetectedCount).toBe(8);
  });

  it('bounds sampled frames with explicit options including maxSteps: 1 and handles ties', () => {
    const map = AsteroidMap.parse('#.#\n#.#');
    const sampled = buildMonitorScanTrace(map, { maxSteps: 2 });
    expect(sampled).toHaveLength(2);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[1]!.stepIndex).toBe(3);

    const singleFrame = buildMonitorScanTrace(map, { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.isFinalStep).toBe(true);
    expect(singleFrame[0]!.isNewBest).toBe(false);

    const singleAsteroid = buildMonitorScanTrace(AsteroidMap.parse('#'));
    expect(singleAsteroid).toHaveLength(1);
    expect(singleAsteroid[0]!.isFinalStep).toBe(true);
    expect(singleAsteroid[0]!.detectedCount).toBe(0);
  });

  it('rejects invalid maxSteps', () => {
    const map = AsteroidMap.parse('#');
    expect(() => buildMonitorScanTrace(map, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildMonitorScanTrace(map, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});

describe('buildVaporizationTrace', () => {
  it('starts poised at 0 vaporized and reaches full schedule with derived getters', () => {
    const map = AsteroidMap.parse(EX1);
    const frames = buildVaporizationTrace(map, 5);
    expect(frames).toHaveLength(10);
    expect(frames[0]!.kind).toBe('vaporization');
    expect(frames[0]!.vaporizedCount).toBe(0);
    expect(frames[0]!.remainingCount).toBe(9);
    expect(frames[0]!.activeEvent).toBeNull();
    expect(frames[0]!.isTargetReached).toBe(false);
    expect(frames[0]!.isFinalStep).toBe(false);

    expect(frames[5]!.vaporizedCount).toBe(5);
    expect(frames[5]!.remainingCount).toBe(4);
    expect(frames[5]!.activeEvent?.order).toBe(5);
    expect(frames[5]!.isTargetReached).toBe(true);

    const last = frames[frames.length - 1]!;
    expect(last.isFinalStep).toBe(true);
    expect(last.remainingCount).toBe(0);
  });

  it('supports omitted/explicit options, maxSteps: 1, 1-asteroid maps, and validates targetOrder/maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_FRAMES).toBe(100);
    const single = AsteroidMap.parse('#');
    const singleFrames = buildVaporizationTrace(single, 1);
    expect(singleFrames).toHaveLength(1);
    expect(singleFrames[0]!.vaporizedCount).toBe(0);
    expect(singleFrames[0]!.activeEvent).toBeNull();
    expect(singleFrames[0]!.isTargetReached).toBe(false);
    expect(singleFrames[0]!.isFinalStep).toBe(true);

    const ex1 = AsteroidMap.parse(EX1);
    const oneStep = buildVaporizationTrace(ex1, 3, { maxSteps: 1 });
    expect(oneStep).toHaveLength(1);
    expect(oneStep[0]!.isFinalStep).toBe(true);
    expect(oneStep[0]!.activeEvent?.order).toBe(9);

    expect(() => buildVaporizationTrace(ex1, 0)).toThrow(RangeError);
    expect(() => buildVaporizationTrace(ex1, 1.5)).toThrow(RangeError);
    expect(() => buildVaporizationTrace(ex1, 1, { maxSteps: 0 })).toThrow(RangeError);
  });
});
