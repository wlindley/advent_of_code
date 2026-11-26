import { describe, expect, it } from 'vitest';
import { type VoxelCoord, VoxelDroplet } from './droplet';
import { ExteriorFlood } from './flood';
import { parseVoxelCoords } from './parser';

const DIRS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
];

function keyOf(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

function oracleSurfaceArea(coords: readonly VoxelCoord[]): { total: number; exterior: number } {
  const lava = new Set<string>();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const c of coords) {
    lava.add(keyOf(c.x, c.y, c.z));
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
    if (c.z < minZ) minZ = c.z;
    if (c.z > maxZ) maxZ = c.z;
  }

  let sharedPairs = 0;
  for (const k of lava) {
    const [x, y, z] = k.split(',').map(Number) as [number, number, number];
    for (const [dx, dy, dz] of DIRS) {
      if (lava.has(keyOf(x + dx, y + dy, z + dz))) sharedPairs += 1;
    }
  }
  const total = 6 * lava.size - sharedPairs;

  const start: [number, number, number] = [minX - 1, minY - 1, minZ - 1];
  const visited = new Set<string>([keyOf(start[0], start[1], start[2])]);
  const queue: Array<[number, number, number]> = [start];
  let exterior = 0;

  for (let head = 0; head < queue.length; head += 1) {
    const [x, y, z] = queue[head]!;
    for (const [dx, dy, dz] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (nx < minX - 1 || nx > maxX + 1 || ny < minY - 1 || ny > maxY + 1 || nz < minZ - 1 || nz > maxZ + 1) {
        continue;
      }
      const nk = keyOf(nx, ny, nz);
      if (lava.has(nk)) {
        exterior += 1;
      } else if (!visited.has(nk)) {
        visited.add(nk);
        queue.push([nx, ny, nz]);
      }
    }
  }
  return { total, exterior };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateHollowShell(size: number): VoxelCoord[] {
  const out: VoxelCoord[] = [];
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        if (x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1) {
          out.push({ x, y, z });
        }
      }
    }
  }
  return out;
}

describe('Day 18 independent Set<string> oracle', () => {
  it('matches official examples and canonical geometric topologies', () => {
    const official2 = parseVoxelCoords('1,1,1\n2,1,1');
    const official13 = parseVoxelCoords(
      '2,2,2\n1,2,2\n3,2,2\n2,1,2\n2,3,2\n2,2,1\n2,2,3\n2,2,4\n2,2,6\n1,2,5\n3,2,5\n2,1,5\n2,3,5',
    );
    const hollow3 = generateHollowShell(3);
    const breached3 = hollow3.filter((c) => !(c.x === 1 && c.y === 1 && c.z === 0));
    const nested5 = [...generateHollowShell(5), { x: 2, y: 2, z: 2 }];
    const tricky: VoxelCoord[] = [
      { x: -5, y: -5, z: -5 },
      { x: -4, y: -4, z: -4 },
      { x: 10, y: -2, z: 3 },
      { x: -5, y: -5, z: -5 },
    ];

    const cases: ReadonlyArray<readonly [readonly VoxelCoord[], number, number]> = [
      [official2, 10, 10],
      [official13, 64, 58],
      [hollow3, 60, 54],
      [breached3, 62, 62],
      [nested5, 210, 150],
      [tricky, 18, 18],
    ];

    for (const [coords, expectedTotal, expectedExterior] of cases) {
      const droplet = VoxelDroplet.fromCoords(coords);
      const flood = ExteriorFlood.compute(droplet);
      const oracle = oracleSurfaceArea(coords);
      expect(droplet.totalSurfaceArea).toBe(expectedTotal);
      expect(flood.exteriorSurfaceArea).toBe(expectedExterior);
      expect(oracle.total).toBe(expectedTotal);
      expect(oracle.exterior).toBe(expectedExterior);
    }
  });

  it('agrees with the Set<string> oracle across 40 seeded PRNG 3D voxel clusters', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const rand = mulberry32(seed * 9973);
      const spanX = 3 + Math.floor(rand() * 5);
      const spanY = 3 + Math.floor(rand() * 5);
      const spanZ = 3 + Math.floor(rand() * 5);
      const density = 0.25 + rand() * 0.55;
      const offsetX = Math.floor(rand() * 11) - 5;
      const offsetY = Math.floor(rand() * 11) - 5;
      const offsetZ = Math.floor(rand() * 11) - 5;

      const coords: VoxelCoord[] = [];
      for (let x = 0; x < spanX; x += 1) {
        for (let y = 0; y < spanY; y += 1) {
          for (let z = 0; z < spanZ; z += 1) {
            if (rand() < density) {
              coords.push({ x: x + offsetX, y: y + offsetY, z: z + offsetZ });
            }
          }
        }
      }
      if (coords.length === 0) coords.push({ x: offsetX, y: offsetY, z: offsetZ });

      const droplet = VoxelDroplet.fromCoords(coords);
      const flood = ExteriorFlood.compute(droplet);
      const oracle = oracleSurfaceArea(coords);
      expect(droplet.totalSurfaceArea).toBe(oracle.total);
      expect(flood.exteriorSurfaceArea).toBe(oracle.exterior);
    }
  });
});
