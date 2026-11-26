import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_13 = [
  '2,2,2', '1,2,2', '3,2,2', '2,1,2', '2,3,2', '2,2,1', '2,2,3',
  '2,2,4', '2,2,6', '1,2,5', '3,2,5', '2,1,5', '2,3,5',
].join('\n');

const DIRS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];

class Prng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function makeHollowShell(size: number, skip?: string): string[] {
  const lines: string[] = [];
  for (let x = 0; x < size; x += 1) for (let y = 0; y < size; y += 1) for (let z = 0; z < size; z += 1) {
    if (x !== 0 && x !== size - 1 && y !== 0 && y !== size - 1 && z !== 0 && z !== size - 1) continue;
    const coord = `${x},${y},${z}`;
    if (coord !== skip) lines.push(coord);
  }
  return lines;
}

function makeBlobInput(seed: number): string {
  const rng = new Prng(seed);
  const density = 0.45 + rng.next() * 0.2;
  const off = Math.floor(rng.next() * 7) - 3;
  const lines: string[] = [];
  for (let x = 0; x < 5; x += 1) for (let y = 0; y < 5; y += 1) for (let z = 0; z < 5; z += 1) {
    if (rng.next() < density) lines.push(`${x + off},${y + off},${z + off}`);
  }
  return lines.length > 0 ? lines.join('\n') : `${off},${off},${off}`;
}

function bfsExteriorOracle(raw: string): number {
  const lava = new Set<string>();
  let [minX, minY, minZ] = [Infinity, Infinity, Infinity];
  let [maxX, maxY, maxZ] = [-Infinity, -Infinity, -Infinity];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    lava.add(t);
    const [x, y, z] = t.split(',').map(Number) as [number, number, number];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  const seen = new Set<string>([`${minX - 1},${minY - 1},${minZ - 1}`]);
  const queue: [number, number, number][] = [[minX - 1, minY - 1, minZ - 1]];
  let faces = 0;
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y, z] = queue[i]!;
    for (const [dx, dy, dz] of DIRS) {
      const [nx, ny, nz] = [x + dx, y + dy, z + dz];
      if (nx < minX - 1 || nx > maxX + 1 || ny < minY - 1 || ny > maxY + 1 || nz < minZ - 1 || nz > maxZ + 1) continue;
      const nk = `${nx},${ny},${nz}`;
      if (lava.has(nk)) faces += 1;
      else if (!seen.has(nk)) { seen.add(nk); queue.push([nx, ny, nz]); }
    }
  }
  return faces;
}

describe('2022 Day 18 Part 2 solver', () => {
  it('solves the official 13-cube example and executes via executeSolver with fake Clock', () => {
    expect(solver.solve(solver.parse(OFFICIAL_13))).toBe(58);
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (ticks += 12) };
    expect(executeSolver(solver, OFFICIAL_13, fakeClock)).toEqual({
      answer: 58, elapsedMs: 12, runtime: 'main-thread',
    });
  });

  it('handles small clusters, diagonal pinches, negative coordinates, and duplicates', () => {
    expect(solver.solve(solver.parse('1,1,1'))).toBe(6);
    expect(solver.solve(solver.parse('1,1,1\n2,1,1'))).toBe(10);
    expect(solver.solve(solver.parse('1,0,0\n-1,0,0\n0,1,0\n0,-1,0\n0,0,1\n0,0,-1'))).toBe(30);
    expect(solver.solve(solver.parse('-3,-2,-1\n-3,-2,-1\n-2,-2,-1'))).toBe(10);
  });

  it('excludes sealed interior cavities and floods breached cavities', () => {
    expect(solver.solve(solver.parse(makeHollowShell(3).join('\n')))).toBe(54);
    expect(solver.solve(solver.parse(makeHollowShell(4).join('\n')))).toBe(96);
    expect(solver.solve(solver.parse([...makeHollowShell(5), '2,2,2'].join('\n')))).toBe(150);
    const breached = solver.parse([...makeHollowShell(5, '2,2,0'), '2,2,2'].join('\n'));
    expect(solver.solve(breached)).toBe(212);
    expect(solver.solve(breached)).toBe(breached.totalSurfaceArea);
  });

  it('matches independent Set<string> 6-connected BFS oracle on shapes and 5 seeded blobs', () => {
    const shapes = [
      OFFICIAL_13, makeHollowShell(3).join('\n'),
      [...makeHollowShell(5), '2,2,2'].join('\n'),
      [...makeHollowShell(5, '2,2,0'), '2,2,2'].join('\n'),
    ];
    for (const raw of shapes) expect(solver.solve(solver.parse(raw))).toBe(bfsExteriorOracle(raw));
    for (let seed = 101; seed <= 105; seed += 1) {
      const raw = makeBlobInput(seed);
      expect(solver.solve(solver.parse(raw))).toBe(bfsExteriorOracle(raw));
    }
  });

  it('traces exterior Z slices with omitted options and custom maxSteps', () => {
    const droplet = solver.parse(OFFICIAL_13);
    const full = solver.trace!(droplet);
    expect(full).toHaveLength(6);
    expect(full.map((f) => f.worldZ)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(full[0]!.mode).toBe('exterior');
    const last = full[full.length - 1]!;
    expect([last.cumulativeExposedFaces, last.totalSurfaceArea, last.trappedAirCount, last.trappedSurfaceArea])
      .toEqual([58, 58, 1, 6]);
    const sampled = solver.trace!(droplet, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect([sampled[3]!.worldZ, sampled[3]!.cumulativeExposedFaces]).toEqual([6, 58]);
  });

  it('rejects malformed coordinates, empty input, and invalid maxSteps separately', () => {
    expect(() => solver.parse('1,2,bad')).toThrow(SyntaxError);
    expect(() => solver.parse('   \n  ')).toThrow(RangeError);
    const droplet = solver.parse('0,0,0');
    expect(() => solver.trace!(droplet, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace!(droplet, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
