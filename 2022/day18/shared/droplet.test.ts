import { describe, expect, it } from 'vitest';
import {
  CELL_EMPTY,
  CELL_EXTERIOR,
  CELL_LAVA,
  CELL_TRAPPED_AIR,
  MAX_GRID_VOLUME,
  VoxelDroplet,
} from './droplet';

describe('VoxelDroplet', () => {
  it('exposes distinct cell kind constants and grid volume cap', () => {
    expect(new Set([CELL_EMPTY, CELL_LAVA, CELL_EXTERIOR, CELL_TRAPPED_AIR]).size).toBe(4);
    expect(MAX_GRID_VOLUME).toBe(2_000_000);
  });

  it('computes 6 faces for a single cube and 1-voxel padding bounds', () => {
    const droplet = VoxelDroplet.fromCoords([{ x: 1, y: 2, z: 3 }]);
    expect(Object.isFrozen(droplet)).toBe(true);
    expect(Object.isFrozen(droplet.bounds)).toBe(true);
    expect(droplet.bounds).toEqual({ minX: 1, maxX: 1, minY: 2, maxY: 2, minZ: 3, maxZ: 3 });
    expect(droplet.originX).toBe(0);
    expect(droplet.originY).toBe(1);
    expect(droplet.originZ).toBe(2);
    expect(droplet.sizeX).toBe(3);
    expect(droplet.sizeY).toBe(3);
    expect(droplet.sizeZ).toBe(3);
    expect(droplet.volume).toBe(27);
    expect(droplet.cubeCount).toBe(1);
    expect(droplet.totalSurfaceArea).toBe(6);
  });

  it('deduplicates repeated coordinates and handles negative coordinates', () => {
    const droplet = VoxelDroplet.fromCoords([
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: -1, y: -2, z: -3 },
      { x: -1, y: -1, z: -3 },
      { x: 1, y: 2, z: 3 },
    ]);
    expect(droplet.cubeCount).toBe(4);
    expect(droplet.totalSurfaceArea).toBe(22);
    expect(droplet.bounds).toEqual({ minX: -1, maxX: 1, minY: -2, maxY: 2, minZ: -3, maxZ: 3 });
  });

  it('rejects empty inputs, non-safe integers, and oversized bounding volumes', () => {
    expect(() => VoxelDroplet.fromCoords([])).toThrow(RangeError);
    expect(() => VoxelDroplet.fromCoords([{ x: 1.5, y: 0, z: 0 }])).toThrow(RangeError);
    expect(() => VoxelDroplet.fromCoords([{ x: 0, y: Number.NaN, z: 0 }])).toThrow(RangeError);
    expect(() =>
      VoxelDroplet.fromCoords([
        { x: Number.MIN_SAFE_INTEGER, y: 0, z: 0 },
        { x: Number.MAX_SAFE_INTEGER, y: 0, z: 0 },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      VoxelDroplet.fromCoords([
        { x: 0, y: 0, z: 0 },
        { x: 250_000, y: 0, z: 0 },
      ]),
    ).toThrow(RangeError);
  });

  it('clones occupancy defensively and validates cell buffer lengths', () => {
    const droplet = VoxelDroplet.fromCoords([
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 1, z: 1 },
    ]);
    const copy = droplet.cloneOccupancy();
    expect(copy).toHaveLength(droplet.volume);
    copy.fill(CELL_EXTERIOR);
    expect(droplet.totalSurfaceArea).toBe(10);

    expect(() => droplet.countFacesAgainst(new Uint8Array(1), CELL_EMPTY)).toThrow(RangeError);
    expect(() => droplet.summarizeSlices(new Uint8Array(1), CELL_EMPTY)).toThrow(RangeError);
  });

  it('summarizes slices across Z layers and extracts defensive slice views', () => {
    const droplet = VoxelDroplet.fromCoords([
      { x: 0, y: 0, z: 5 },
      { x: 0, y: 0, z: 6 },
      { x: 1, y: 0, z: 6 },
    ]);
    const occupancy = droplet.cloneOccupancy();
    const summaries = droplet.summarizeSlices(occupancy, CELL_EMPTY);
    expect(summaries).toEqual([
      { lz: 1, worldZ: 5, lavaCount: 1, exposedFaces: 5 },
      { lz: 2, worldZ: 6, lavaCount: 2, exposedFaces: 9 },
    ]);

    const slice = droplet.sliceOccupancy(1);
    expect(slice).toHaveLength(droplet.sizeX * droplet.sizeY);
    expect(Array.from(slice).filter((c) => c === CELL_LAVA)).toHaveLength(1);
    slice.fill(CELL_EMPTY);
    expect(Array.from(droplet.sliceOccupancy(1)).filter((c) => c === CELL_LAVA)).toHaveLength(1);

    expect(() => droplet.sliceOccupancy(-1)).toThrow(RangeError);
    expect(() => droplet.sliceOccupancy(droplet.sizeZ)).toThrow(RangeError);
    expect(() => droplet.sliceOccupancy(1.2)).toThrow(RangeError);
  });
});
