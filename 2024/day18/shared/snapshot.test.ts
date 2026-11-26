import { describe, expect, it } from 'vitest';
import { MemorySpace, UNVISITED } from './model';
import { parseMemorySpace } from './parser';
import {
  DEFAULT_MAX_TRACE_STEPS,
  buildCorruptionAndWaveTrace,
  createStaticSnapshot,
} from './snapshot';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

describe('createStaticSnapshot', () => {
  it('builds a frozen complete snapshot with dynamic wave and corruption queries', () => {
    const space = parseMemorySpace(EXAMPLE_INPUT, 7);
    const snap = createStaticSnapshot(space, 12);

    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap.phase).toBe('complete');
    expect(snap.fallenCount).toBe(12);
    expect(snap.latestByte).toEqual({ x: 5, y: 1 });
    expect(snap.blockingByte).toBeNull();
    expect(snap.reachable).toBe(true);
    expect(snap.shortestDistance).toBe(22);
    expect(snap.maxWaveDistance).toBeGreaterThanOrEqual(22);
    expect(snap.revealedVisitedCount).toBeGreaterThan(22);
    expect(snap.isCorruptedAt(5, 4)).toBe(true);
    expect(snap.isCorruptedAt(0, 0)).toBe(false);
    expect(snap.distanceAt(0, 0)).toBe(0);
    expect(snap.distanceAt(5, 4)).toBe(UNVISITED);
  });

  it('supports custom phase, waveLimit, blockingByte, zero fallen bytes, and hidden path', () => {
    const space = parseMemorySpace(EXAMPLE_INPUT, 7);
    const snap0 = createStaticSnapshot(space, 0, {
      phase: 'wave',
      waveLimit: 2,
      blockingByte: { x: 6, y: 1 },
      showPath: false,
    });

    expect(snap0.fallenCount).toBe(0);
    expect(snap0.latestByte).toBeNull();
    expect(snap0.blockingByte).toEqual({ x: 6, y: 1 });
    expect(snap0.reachable).toBe(false);
    expect(snap0.shortestDistance).toBeNull();
    expect(snap0.maxWaveDistance).toBe(2);
    expect(snap0.distanceAt(2, 0)).toBe(2);
    expect(snap0.distanceAt(3, 0)).toBe(UNVISITED);

    const hiddenWave = createStaticSnapshot(space, 12, {
      phase: 'corrupting',
      waveLimit: -1,
      latestByte: null,
    });
    expect(hiddenWave.latestByte).toBeNull();
    expect(hiddenWave.maxWaveDistance).toBe(-1);
    expect(hiddenWave.revealedVisitedCount).toBe(0);
  });
});

describe('buildCorruptionAndWaveTrace', () => {
  it('has default max steps of 80 and respects maxSteps = 1 and maxSteps = 2', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    const space = parseMemorySpace(EXAMPLE_INPUT, 7);

    const one = buildCorruptionAndWaveTrace(space, 12, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.phase).toBe('complete');
    expect(one[0]!.shortestDistance).toBe(22);

    const two = buildCorruptionAndWaveTrace(space, 12, { maxSteps: 2 });
    expect(two).toHaveLength(2);
    expect(two[0]!.phase).toBe('corrupting');
    expect(two[1]!.phase).toBe('complete');

    expect(() => buildCorruptionAndWaveTrace(space, 12, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('handles zero fallen bytes, blocked endpoints, and capped traces', () => {
    const space = parseMemorySpace(EXAMPLE_INPUT, 7);

    const zeroFall = buildCorruptionAndWaveTrace(space, 0, { maxSteps: 10 });
    expect(zeroFall.every((f) => f.phase !== 'corrupting')).toBe(true);
    expect(zeroFall[0]!.phase).toBe('wave');
    expect(zeroFall[zeroFall.length - 1]!.phase).toBe('complete');

    const blockedStart = new MemorySpace(3, [{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    const blockedTrace = buildCorruptionAndWaveTrace(blockedStart, 2, { maxSteps: 10 });
    expect(blockedTrace.every((f) => f.phase !== 'wave')).toBe(true);
    expect(blockedTrace[blockedTrace.length - 1]!.reachable).toBe(false);

    const fullTrace = buildCorruptionAndWaveTrace(space, 12);
    expect(fullTrace.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(fullTrace[0]!.phase).toBe('corrupting');
    expect(fullTrace[0]!.fallenCount).toBe(0);
    expect(fullTrace[fullTrace.length - 1]!.phase).toBe('complete');
    expect(fullTrace[fullTrace.length - 1]!.shortestDistance).toBe(22);

    const capped = buildCorruptionAndWaveTrace(space, 12, { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    expect(capped[0]!.phase).toBe('corrupting');
    expect(capped[capped.length - 1]!.phase).toBe('complete');
  });
});
