import { describe, expect, it } from 'vitest';
import { MANHATTAN_METRIC, SIGNAL_DELAY_METRIC } from './metric';
import { parseWirePair } from './parser';
import {
  DEFAULT_MAX_TRACE_STEPS,
  computeWireBounds,
  projectPoint,
  traceCrossedWires,
} from './trace';

describe('computeWireBounds', () => {
  it('includes origin and all segment endpoints from both wires', () => {
    const pair = parseWirePair('R8,U5,L5,D3\nL4,D6');
    expect(computeWireBounds(pair)).toEqual({
      minX: -4n,
      maxX: 8n,
      minY: -6n,
      maxY: 5n,
    });
  });

  it('anchors origin when all moves stay in one quadrant', () => {
    const pos = parseWirePair('R5,U3\nR2,U1');
    expect(computeWireBounds(pos)).toEqual({ minX: 0n, maxX: 5n, minY: 0n, maxY: 3n });
    const neg = parseWirePair('L5,D3\nL2,D1');
    expect(computeWireBounds(neg)).toEqual({ minX: -5n, maxX: 0n, minY: -3n, maxY: 0n });
  });
});

describe('projectPoint', () => {
  it('throws RangeError when viewport available width or height is non-positive', () => {
    const bounds = { minX: 0n, maxX: 10n, minY: 0n, maxY: 10n };
    expect(() => projectPoint({ x: 0n, y: 0n }, bounds, { width: 40, height: 100, padding: 20 })).toThrow(RangeError);
    expect(() => projectPoint({ x: 0n, y: 0n }, bounds, { width: 100, height: 40, padding: 20 })).toThrow(RangeError);
  });

  it('handles zero-span, horizontal-only, and vertical-only bounds', () => {
    const vp = { width: 220, height: 120, padding: 10 };
    expect(projectPoint({ x: 0n, y: 0n }, { minX: 0n, maxX: 0n, minY: 0n, maxY: 0n }, vp)).toEqual({
      x: 110,
      y: 60,
    });

    const vBounds = { minX: 0n, maxX: 0n, minY: -5n, maxY: 5n };
    expect(projectPoint({ x: 0n, y: -5n }, vBounds, vp)).toEqual({ x: 110, y: 110 });
    expect(projectPoint({ x: 0n, y: 5n }, vBounds, vp)).toEqual({ x: 110, y: 10 });

    const hBounds = { minX: -5n, maxX: 5n, minY: 0n, maxY: 0n };
    expect(projectPoint({ x: -5n, y: 0n }, hBounds, vp)).toEqual({ x: 10, y: 60 });
    expect(projectPoint({ x: 5n, y: 0n }, hBounds, vp)).toEqual({ x: 210, y: 60 });
  });

  it('preserves aspect ratio and +Y upward orientation in width- and height-constrained viewports', () => {
    const wideVp = { width: 420, height: 220, padding: 10 };
    const wideBounds = { minX: 0n, maxX: 100n, minY: 0n, maxY: 20n };
    expect(projectPoint({ x: 0n, y: 0n }, wideBounds, wideVp)).toEqual({ x: 10, y: 150 });
    expect(projectPoint({ x: 100n, y: 20n }, wideBounds, wideVp)).toEqual({ x: 410, y: 70 });

    const tallBounds = { minX: 0n, maxX: 20n, minY: 0n, maxY: 100n };
    expect(projectPoint({ x: 0n, y: 0n }, tallBounds, wideVp)).toEqual({ x: 190, y: 210 });
    expect(projectPoint({ x: 20n, y: 100n }, tallBounds, wideVp)).toEqual({ x: 230, y: 10 });
  });

  it('projects 10^25 BigInt coordinates without overflow or collapse', () => {
    const scale = 10_000_000_000_000_000_000_000_000n;
    const bounds = { minX: 0n, maxX: scale, minY: 0n, maxY: scale };
    const vp = { width: 220, height: 220, padding: 10 };
    expect(projectPoint({ x: 0n, y: 0n }, bounds, vp)).toEqual({ x: 10, y: 210 });
    expect(projectPoint({ x: scale / 2n, y: scale / 2n }, bounds, vp)).toEqual({ x: 110, y: 110 });
    expect(projectPoint({ x: scale, y: scale }, bounds, vp)).toEqual({ x: 210, y: 10 });
  });
});

describe('traceCrossedWires', () => {
  it('emits frames with cumulative visible segments, crossings, and bestCrossing', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    const pair = parseWirePair('R8,U5,L5,D3\nU7,R6,D4,L4');
    const frames = traceCrossedWires(pair, MANHATTAN_METRIC);
    expect(frames).toHaveLength(4);
    expect(frames[0]!.bestCrossing).toBeNull();
    expect(frames[2]!.discoveredCrossings).toHaveLength(1);
    expect(frames[2]!.bestCrossing!.manhattanDistance).toBe(11n);
    expect(frames[3]!.discoveredCrossings).toHaveLength(2);
    expect(frames[3]!.bestCrossing!.manhattanDistance).toBe(6n);

    const delayFrames = traceCrossedWires(pair, SIGNAL_DELAY_METRIC);
    expect(delayFrames[3]!.bestCrossing!.signalDelay).toBe(30n);
  });

  it('samples long traces up to maxSteps and handles zero-crossing or empty pairs', () => {
    const moves = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 'R1' : 'U1')).join(',');
    const pair = parseWirePair(`${moves}\nL10`);
    const sampled = traceCrossedWires(pair, MANHATTAN_METRIC, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[2]!.stepIndex).toBe(9);
    expect(sampled[2]!.bestCrossing).toBeNull();

    expect(traceCrossedWires({ first: [], second: [] }, MANHATTAN_METRIC)).toEqual([]);
    expect(() => traceCrossedWires(pair, MANHATTAN_METRIC, { maxSteps: 0 })).toThrow(RangeError);
  });
});
