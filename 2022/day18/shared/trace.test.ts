import { describe, expect, it } from 'vitest';
import { CELL_EMPTY, CELL_EXTERIOR, CELL_LAVA, CELL_TRAPPED_AIR, VoxelDroplet } from './droplet';
import { parseDroplet } from './parser';
import { DEFAULT_TRACE_MAX_STEPS, traceExteriorSurface, traceTotalSurface } from './trace';

const OFFICIAL_13 = [
  '2,2,2', '1,2,2', '3,2,2', '2,1,2', '2,3,2', '2,2,1', '2,2,3',
  '2,2,4', '2,2,6', '1,2,5', '3,2,5', '2,1,5', '2,3,5',
].join('\n');

describe('Day 18 slice tracing', () => {
  it('traces total surface area slice by slice for the official example', () => {
    const droplet = parseDroplet(OFFICIAL_13);
    const frames = traceTotalSurface(droplet);
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(60);
    expect(frames).toHaveLength(6);
    expect(frames[0]!.mode).toBe('total');
    expect(frames[0]!.worldZ).toBe(1);
    expect(frames[0]!.activeLz).toBe(1);
    const last = frames[frames.length - 1]!;
    expect(last.worldZ).toBe(6);
    expect(last.cumulativeLavaCount).toBe(13);
    expect(last.cumulativeExposedFaces).toBe(64);
    expect(last.totalSurfaceArea).toBe(64);
    expect(last.trappedAirCount).toBe(0);
    expect(last.trappedSurfaceArea).toBe(0);
    expect(last.sliceCells).toHaveLength(droplet.sizeX * droplet.sizeY);
    expect(Array.from(last.sliceCells).every((c) => c === CELL_EMPTY || c === CELL_LAVA)).toBe(true);
  });

  it('traces exterior surface area and trapped air pockets for Part 2 reuse', () => {
    const droplet = parseDroplet(OFFICIAL_13);
    const frames = traceExteriorSurface(droplet);
    expect(frames).toHaveLength(6);
    const sliceZ5 = frames.find((f) => f.worldZ === 5)!;
    expect(sliceZ5.mode).toBe('exterior');
    expect(Array.from(sliceZ5.sliceCells).filter((c) => c === CELL_TRAPPED_AIR)).toHaveLength(1);
    expect(Array.from(sliceZ5.sliceCells).filter((c) => c === CELL_EXTERIOR).length).toBeGreaterThan(0);
    const last = frames[frames.length - 1]!;
    expect(last.cumulativeLavaCount).toBe(13);
    expect(last.cumulativeExposedFaces).toBe(58);
    expect(last.totalSurfaceArea).toBe(58);
    expect(last.trappedAirCount).toBe(1);
    expect(last.trappedSurfaceArea).toBe(6);
  });

  it('bounds frame count with maxSteps while preserving final slice totals', () => {
    const coords = Array.from({ length: 80 }, (_, z) => ({ x: 0, y: 0, z }));
    const droplet = VoxelDroplet.fromCoords(coords);

    const defaultFrames = traceTotalSurface(droplet);
    expect(defaultFrames).toHaveLength(DEFAULT_TRACE_MAX_STEPS);
    expect(defaultFrames[0]!.worldZ).toBe(0);
    expect(defaultFrames[defaultFrames.length - 1]!.worldZ).toBe(79);
    expect(defaultFrames[defaultFrames.length - 1]!.cumulativeExposedFaces).toBe(droplet.totalSurfaceArea);

    const singleFrame = traceTotalSurface(droplet, { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.worldZ).toBe(79);
    expect(singleFrame[0]!.cumulativeLavaCount).toBe(80);
    expect(singleFrame[0]!.cumulativeExposedFaces).toBe(droplet.totalSurfaceArea);

    expect(() => traceTotalSurface(droplet, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceExteriorSurface(droplet, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
