import { describe, expect, it } from 'vitest';
import { DatastreamBuffer } from './buffer';
import {
  createMarkerSolver,
  DEFAULT_MAX_TRACE_STEPS,
  MarkerTraceFrame,
  traceMarkerSearch,
} from './trace';

const EXAMPLE_1 = 'mjqjpqmgbljsphdztnvjfqwrcgsmlb';

describe('traceMarkerSearch', () => {
  it('traces all 7 steps of Example 1 with dynamic getters and collision telemetry', () => {
    const buffer = new DatastreamBuffer(EXAMPLE_1);
    const frames = traceMarkerSearch(buffer, 4);

    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(7);

    const step0 = frames[0]!;
    expect(step0).toBeInstanceOf(MarkerTraceFrame);
    expect(Object.isFrozen(step0)).toBe(true);
    expect(Object.isFrozen(step0.lastSeen)).toBe(true);
    expect(step0.lastSeen).toHaveLength(26);
    expect(step0.currentChar).toBe('m');
    expect(step0.position).toBe(1);
    expect(step0.windowStart).toBe(0);
    expect(step0.windowLength).toBe(1);
    expect(step0.windowText).toBe('m');
    expect(step0.hasCollision).toBe(false);
    expect(step0.collisionIndex).toBeNull();
    expect(step0.jumpDistance).toBe(0);
    expect(step0.collisionCount).toBe(0);
    expect(step0.isMarkerFound).toBe(false);
    expect(step0.totalVisited).toBe(7);
    expect(step0.totalSteps).toBe(7);

    // Interior collision: cursor=3 ('j' previously at 1, prevWindowStart=0)
    const step3 = frames[3]!;
    expect(step3.currentChar).toBe('j');
    expect(step3.hasCollision).toBe(true);
    expect(step3.collisionIndex).toBe(1);
    expect(step3.prevWindowStart).toBe(0);
    expect(step3.windowStart).toBe(2);
    expect(step3.jumpDistance).toBe(2);
    expect(step3.windowText).toBe('qj');
    expect(step3.collisionCount).toBe(1);

    // Boundary collision: cursor=5 ('q' previously at 2 === prevWindowStart=2)
    const step5 = frames[5]!;
    expect(step5.currentChar).toBe('q');
    expect(step5.hasCollision).toBe(true);
    expect(step5.collisionIndex).toBe(2);
    expect(step5.prevWindowStart).toBe(2);
    expect(step5.windowStart).toBe(3);
    expect(step5.jumpDistance).toBe(1);
    expect(step5.windowText).toBe('jpq');
    expect(step5.collisionCount).toBe(2);

    // Stale lastSeen before start: cursor=6 ('m' at 0 < prevWindowStart=3) -> marker found
    const step6 = frames[6]!;
    expect(step6.currentChar).toBe('m');
    expect(step6.position).toBe(7);
    expect(step6.hasCollision).toBe(false);
    expect(step6.collisionIndex).toBeNull();
    expect(step6.jumpDistance).toBe(0);
    expect(step6.windowStart).toBe(3);
    expect(step6.windowLength).toBe(4);
    expect(step6.windowText).toBe('jpqm');
    expect(step6.collisionCount).toBe(2);
    expect(step6.isMarkerFound).toBe(true);
    expect(step6.lastSeen[12]).toBe(6); // 'm' updated to 6
  });

  it('samples uniformly while preserving endpoints for maxSteps=4 and maxSteps=1', () => {
    const buffer = new DatastreamBuffer(EXAMPLE_1);
    const sampled4 = traceMarkerSearch(buffer, 4, { maxSteps: 4 });
    expect(sampled4.map((f) => f.position)).toEqual([1, 3, 5, 7]);
    expect(sampled4[3]!.isMarkerFound).toBe(true);
    expect(sampled4[3]!.totalSteps).toBe(4);
    expect(sampled4[3]!.totalVisited).toBe(7);

    const sampled1 = traceMarkerSearch(buffer, 4, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.position).toBe(7);
    expect(sampled1[0]!.isMarkerFound).toBe(true);
  });

  it('defaults maxSteps to DEFAULT_MAX_TRACE_STEPS and propagates invalid inputs', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const buffer = new DatastreamBuffer(EXAMPLE_1);
    for (const invalid of [0, -2, 1.5, Number.NaN]) {
      expect(() => traceMarkerSearch(buffer, 4, { maxSteps: invalid })).toThrow(RangeError);
    }
    expect(() => traceMarkerSearch(buffer, 0)).toThrow(RangeError);
    expect(() => traceMarkerSearch(new DatastreamBuffer('aaaa'), 4)).toThrow(RangeError);
  });
});

describe('createMarkerSolver', () => {
  it('eagerly validates windowSize and returns a frozen MarkerSolver', () => {
    expect(() => createMarkerSolver(0)).toThrow(RangeError);
    expect(() => createMarkerSolver(27)).toThrow(RangeError);

    const solver = createMarkerSolver(4);
    expect(Object.isFrozen(solver)).toBe(true);
    const parsed = solver.parse(`  ${EXAMPLE_1} \n`);
    expect(solver.solve(parsed)).toBe(7);
    const frames = solver.trace(parsed, { maxSteps: 4 });
    expect(frames.at(-1)?.position).toBe(7);
  });
});
