import { describe, expect, it } from 'vitest';
import { CELL_EXTERIOR, CELL_LAVA, CELL_TRAPPED_AIR } from './droplet';
import { ExteriorFlood } from './flood';
import { parseDroplet } from './parser';

const OFFICIAL_13 = [
  '2,2,2', '1,2,2', '3,2,2', '2,1,2', '2,3,2', '2,2,1', '2,2,3',
  '2,2,4', '2,2,6', '1,2,5', '3,2,5', '2,1,5', '2,3,5',
].join('\n');

function hollowShellCoords(size: number, skip?: (x: number, y: number, z: number) => boolean): string {
  const lines: string[] = [];
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        const onBoundary = x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1;
        if (onBoundary && !(skip && skip(x, y, z))) {
          lines.push(`${x},${y},${z}`);
        }
      }
    }
  }
  return lines.join('\n');
}

describe('ExteriorFlood', () => {
  it('computes exterior air and wave distances for a single cube', () => {
    const droplet = parseDroplet('1,1,1');
    const flood = ExteriorFlood.compute(droplet);
    expect(Object.isFrozen(flood)).toBe(true);
    expect(flood.droplet).toBe(droplet);
    expect(flood.exteriorSurfaceArea).toBe(6);
    expect(flood.trappedSurfaceArea).toBe(0);
    expect(flood.trappedAirCount).toBe(0);
    expect(flood.exteriorAirCount).toBe(26);
    expect(flood.maxWave).toBe(6);
  });

  it('isolates the single trapped air pocket in the official 13-cube example', () => {
    const droplet = parseDroplet(OFFICIAL_13);
    const flood = ExteriorFlood.compute(droplet);
    expect(droplet.totalSurfaceArea).toBe(64);
    expect(flood.exteriorSurfaceArea).toBe(58);
    expect(flood.trappedSurfaceArea).toBe(6);
    expect(flood.trappedAirCount).toBe(1);
    expect(flood.exteriorAirCount + flood.trappedAirCount + droplet.cubeCount).toBe(droplet.volume);
  });

  it('distinguishes sealed shells from breached shells', () => {
    const sealed = ExteriorFlood.compute(parseDroplet(hollowShellCoords(3)));
    expect(sealed.exteriorSurfaceArea).toBe(54);
    expect(sealed.trappedSurfaceArea).toBe(6);
    expect(sealed.trappedAirCount).toBe(1);

    const breached = ExteriorFlood.compute(parseDroplet(hollowShellCoords(3, (x, y, z) => x === 1 && y === 1 && z === 0)));
    expect(breached.trappedAirCount).toBe(0);
    expect(breached.trappedSurfaceArea).toBe(0);
    expect(breached.exteriorSurfaceArea).toBe(breached.droplet.totalSurfaceArea);
  });

  it('clones cells/waves defensively and slices Z planes with bounds checks', () => {
    const droplet = parseDroplet(OFFICIAL_13);
    const flood = ExteriorFlood.compute(droplet);

    const cells = flood.cloneCells();
    const waves = flood.cloneWaves();
    expect(cells).toHaveLength(droplet.volume);
    expect(waves).toHaveLength(droplet.volume);
    expect(waves[0]).toBe(0);
    cells.fill(CELL_LAVA);
    waves.fill(-99);
    expect(flood.exteriorSurfaceArea).toBe(58);
    expect(flood.cloneWaves()[0]).toBe(0);

    // worldZ = 5 corresponds to lz = 5 - originZ = 5 - 0 = 5, which holds the trapped air at (2,2,5)
    const slice = flood.sliceCells(5);
    expect(Array.from(slice).filter((c) => c === CELL_TRAPPED_AIR)).toHaveLength(1);
    expect(Array.from(slice).filter((c) => c === CELL_EXTERIOR).length).toBeGreaterThan(0);
    slice.fill(CELL_LAVA);
    expect(Array.from(flood.sliceCells(5)).filter((c) => c === CELL_TRAPPED_AIR)).toHaveLength(1);

    expect(() => flood.sliceCells(-1)).toThrow(RangeError);
    expect(() => flood.sliceCells(droplet.sizeZ)).toThrow(RangeError);
  });
});
