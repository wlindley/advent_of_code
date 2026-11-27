import { describe, expect, it } from 'vitest';
import { parseCaveSystem } from './parser';
import { NO_REVISIT_POLICY, SINGLE_SMALL_REVISIT_POLICY } from './policy';
import { captureCaveTrace, DEFAULT_TRACE_MAX_STEPS } from './trace';

describe('captureCaveTrace', () => {
  it('records untrimmed exploration, path-found, and summary frames with omitted options', () => {
    const system = parseCaveSystem('start-end');
    const frames = captureCaveTrace(system, NO_REVISIT_POLICY, 1n);

    expect(DEFAULT_TRACE_MAX_STEPS).toBe(120);
    expect(frames).toHaveLength(3);
    expect(frames[0]).toEqual({
      step: 0,
      status: 'exploring',
      path: ['start'],
      discoveredPaths: 0,
      totalPaths: 1n,
      truncated: false,
    });
    expect(frames[1]).toEqual({
      step: 1,
      status: 'path-found',
      path: ['start', 'end'],
      discoveredPaths: 1,
      totalPaths: 1n,
      truncated: false,
    });
    expect(frames[2]).toEqual({
      step: 2,
      status: 'summary',
      path: ['start'],
      discoveredPaths: 1,
      totalPaths: 1n,
      truncated: false,
    });
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(Object.isFrozen(frames[0]!.path)).toBe(true);
  });

  it('matches the exact boundary between dfsFrames + 1 (untruncated) and dfsFrames (truncated)', () => {
    const system = parseCaveSystem('start-A\nstart-b\nA-end\nb-end');
    const full = captureCaveTrace(system, NO_REVISIT_POLICY, 2n);
    const dfsFrames = full.length - 1;

    const exactFit = captureCaveTrace(system, NO_REVISIT_POLICY, 2n, { maxSteps: dfsFrames + 1 });
    expect(exactFit).toHaveLength(dfsFrames + 1);
    expect(exactFit.at(-1)?.truncated).toBe(false);
    expect(exactFit.at(-1)?.status).toBe('summary');

    const oneShort = captureCaveTrace(system, NO_REVISIT_POLICY, 2n, { maxSteps: dfsFrames });
    expect(oneShort).toHaveLength(dfsFrames);
    expect(oneShort.at(-1)?.truncated).toBe(true);
    expect(oneShort.at(-1)?.status).toBe('summary');
  });

  it('handles maxSteps: 1 and disconnected 0n graphs both untrimmed and capped at 1', () => {
    const disconnected = parseCaveSystem('start-a\nb-end');

    const untrimmed = captureCaveTrace(disconnected, NO_REVISIT_POLICY, 0n);
    expect(untrimmed.map((f) => f.path)).toEqual([['start'], ['start', 'a'], ['start']]);
    expect(untrimmed.at(-1)).toEqual({
      step: 2,
      status: 'summary',
      path: ['start'],
      discoveredPaths: 0,
      totalPaths: 0n,
      truncated: false,
    });

    const capped = captureCaveTrace(disconnected, NO_REVISIT_POLICY, 0n, { maxSteps: 1 });
    expect(capped).toEqual([
      {
        step: 0,
        status: 'summary',
        path: ['start'],
        discoveredPaths: 0,
        totalPaths: 0n,
        truncated: true,
      },
    ]);
  });

  it('preserves visitedSmall membership when backtracking out of a Part 2 small-cave revisit', () => {
    const system = parseCaveSystem('start-a\na-b\nb-c\na-c\nc-end');
    const frames = captureCaveTrace(system, SINGLE_SMALL_REVISIT_POLICY, 4n);
    const foundPaths = frames
      .filter((frame) => frame.status === 'path-found')
      .map((frame) => frame.path.join(','));

    expect(foundPaths).toEqual([
      'start,a,b,a,c,end',
      'start,a,b,c,end',
      'start,a,c,b,c,end',
      'start,a,c,end',
    ]);
  });

  it('rejects invalid maxSteps values', () => {
    const system = parseCaveSystem('start-end');
    expect(() => captureCaveTrace(system, NO_REVISIT_POLICY, 1n, { maxSteps: 0 })).toThrow(
      RangeError,
    );
    expect(() => captureCaveTrace(system, NO_REVISIT_POLICY, 1n, { maxSteps: -2 })).toThrow(
      RangeError,
    );
  });
});
