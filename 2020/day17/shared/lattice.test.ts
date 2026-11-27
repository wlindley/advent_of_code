import { describe, expect, it } from 'vitest';
import { PocketLattice } from './lattice';
import { parsePocketSlice, type PocketSlice } from './model';
import { POCKET_3D_POLICY, POCKET_4D_POLICY, type PocketPolicy } from './policies';

const EXAMPLE = '.#.\n..#\n###';

function sparseStep(active: Set<string>, dimensions: 3 | 4): Set<string> {
  const counts = new Map<string, number>();
  const dwRange = dimensions === 4 ? [-1, 0, 1] : [0];

  for (const key of active) {
    const [x = 0, y = 0, z = 0, w = 0] = key.split(',').map(Number);
    for (const dw of dwRange) {
      for (let dz = -1; dz <= 1; dz += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0 && dz === 0 && dw === 0) continue;
            const nk = `${x + dx},${y + dy},${z + dz},${w + dw}`;
            counts.set(nk, (counts.get(nk) ?? 0) + 1);
          }
        }
      }
    }
  }

  const next = new Set<string>();
  for (const [key, n] of counts) {
    if (n === 3 || (n === 2 && active.has(key))) {
      next.add(key);
    }
  }
  return next;
}

function sparseSimulate(slice: PocketSlice, dimensions: 3 | 4, cycles: number): number {
  let active = new Set<string>();
  for (let y = 0; y < slice.height; y += 1) {
    for (let x = 0; x < slice.width; x += 1) {
      if (slice.isActive(x, y)) active.add(`${x},${y},0,0`);
    }
  }
  for (let c = 0; c < cycles; c += 1) {
    active = sparseStep(active, dimensions);
  }
  return active.size;
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function randomSlice(seed: number): PocketSlice {
  let s = seed >>> 0;
  s = nextPrng(s);
  const w = 1 + (s % 5);
  s = nextPrng(s);
  const h = 1 + (s % 5);
  const rows: string[] = [];
  for (let y = 0; y < h; y += 1) {
    let row = '';
    for (let x = 0; x < w; x += 1) {
      s = nextPrng(s);
      row += s % 2 === 0 ? '#' : '.';
    }
    rows.push(row);
  }
  return parsePocketSlice(rows.join('\n'));
}

describe('PocketLattice', () => {
  it('solves the official 3D example to 112 active cubes and records transition diffs', () => {
    const seed = parsePocketSlice(EXAMPLE);
    const lattice = new PocketLattice(seed, POCKET_3D_POLICY);
    expect(lattice.cycle).toBe(0);
    expect(lattice.maxCycles).toBe(6);
    expect(lattice.dimensions).toBe(3);

    const frame0 = lattice.snapshotFrame();
    expect(frame0.cycle).toBe(0);
    expect(frame0.survivingCount).toBe(5);
    expect(frame0.bornCount).toBe(0);
    expect(frame0.dyingCount).toBe(0);
    expect(frame0.activeCount).toBe(5);

    lattice.stepCycle();
    const frame1 = lattice.snapshotFrame();
    expect(frame1.cycle).toBe(1);
    expect(frame1.activeCount).toBe(11);
    expect(frame1.bornCount).toBeGreaterThan(0);
    expect(frame1.dyingCount).toBeGreaterThan(0);

    while (lattice.cycle < lattice.maxCycles) {
      lattice.stepCycle();
    }
    expect(lattice.activeCount).toBe(112);
    expect(lattice.snapshotFrame().activeCount).toBe(112);
  });

  it('solves the official 4D example to 848 active hypercubes', () => {
    const seed = parsePocketSlice(EXAMPLE);
    const lattice = new PocketLattice(seed, POCKET_4D_POLICY);
    while (lattice.cycle < lattice.maxCycles) {
      lattice.stepCycle();
    }
    const finalFrame = lattice.snapshotFrame();
    expect(lattice.activeCount).toBe(848);
    expect(finalFrame.activeCount).toBe(848);
    expect(finalFrame.wValues.length).toBeGreaterThan(1);
  });

  it('matches the sparse Set oracle across 16 seeded rectangular grids in 3D and 4D', () => {
    for (let i = 1; i <= 16; i += 1) {
      const seed = randomSlice(i * 7919 + 42);
      const cycles = 1 + (i % 4);
      const dims = i % 2 === 0 ? 4 : 3;
      const policy: PocketPolicy = { id: dims === 4 ? '4d' : '3d', label: 'test', dimensions: dims, cycles };
      const lattice = new PocketLattice(seed, policy);
      for (let c = 0; c < cycles; c += 1) {
        lattice.stepCycle();
      }
      expect(lattice.activeCount).toBe(sparseSimulate(seed, dims, cycles));
    }
  });

  it('handles cycles=0, all-inactive 3D/4D seeds, dying-only cells, and cycle overflow guards', () => {
    const zeroPolicy: PocketPolicy = { id: '3d', label: 'zero', dimensions: 3, cycles: 0 };
    const single = parsePocketSlice('#');
    const zeroLattice = new PocketLattice(single, zeroPolicy);
    expect(zeroLattice.activeCount).toBe(1);
    expect(() => zeroLattice.stepCycle()).toThrow(RangeError);

    const emptySeed = parsePocketSlice('..');
    for (const dims of [3, 4] as const) {
      const p: PocketPolicy = { id: dims === 4 ? '4d' : '3d', label: 'empty', dimensions: dims, cycles: 1 };
      const lat = new PocketLattice(emptySeed, p);
      lat.stepCycle();
      const frame = lat.snapshotFrame();
      expect(frame.activeCount).toBe(0);
      expect(frame.slices).toHaveLength(1);
      expect(frame.slices[0]?.z).toBe(0);
      expect(frame.slices[0]?.w).toBe(0);
    }

    const dyingLattice = new PocketLattice(single, { id: '3d', label: 'one', dimensions: 3, cycles: 1 });
    dyingLattice.stepCycle();
    const dyingFrame = dyingLattice.snapshotFrame();
    expect(dyingFrame.activeCount).toBe(0);
    expect(dyingFrame.dyingCount).toBe(1);

    expect(() => new PocketLattice(single, { id: '3d', label: 'bad', dimensions: 3, cycles: -1 })).toThrow(RangeError);
    expect(() => new PocketLattice(single, { id: '3d', label: 'bad', dimensions: 3, cycles: 1.5 })).toThrow(RangeError);
  });
});
