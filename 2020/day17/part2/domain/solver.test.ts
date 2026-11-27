import { describe, expect, it } from 'vitest';
import { POCKET_4D_POLICY, type PocketSliceSnapshot } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = '.#.\n..#\n###';

function addNeighbors4D(counts: Map<string, number>, key: string): void {
  const [x = 0, y = 0, z = 0, w = 0] = key.split(',').map(Number);
  for (let dw = -1; dw <= 1; dw += 1) {
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

function stepSparse4D(active: Set<string>): Set<string> {
  const counts = new Map<string, number>();
  for (const key of active) addNeighbors4D(counts, key);
  const next = new Set<string>();
  for (const [key, n] of counts) {
    if (n === 3 || (n === 2 && active.has(key))) next.add(key);
  }
  return next;
}

function sparse4DCounts(raw: string, cycles: number): number[] {
  const rows = raw.trim().split('\n');
  let active = new Set<string>();
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y]!;
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '#') active.add(`${x},${y},0,0`);
    }
  }
  const out = [active.size];
  for (let c = 0; c < cycles; c += 1) {
    active = stepSparse4D(active);
    out.push(active.size);
  }
  return out;
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function makeRandomSeed(seed: number): string {
  let s = nextPrng(seed);
  const w = 1 + ((s >>> 24) & 3);
  s = nextPrng(s);
  const h = 1 + ((s >>> 24) & 3);
  const rows: string[] = [];
  for (let y = 0; y < h; y += 1) {
    let row = '';
    for (let x = 0; x < w; x += 1) {
      s = nextPrng(s);
      row += ((s >>> 24) & 1) === 1 ? '#' : '.';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function findSlice(slices: readonly PocketSliceSnapshot[], z: number, w: number): PocketSliceSnapshot | undefined {
  for (const slice of slices) {
    if (slice.z === z && slice.w === w) return slice;
  }
  return undefined;
}

function expectMatchingSlices(a: PocketSliceSnapshot, b: PocketSliceSnapshot): void {
  expect(a.xMin).toBe(b.xMin);
  expect(a.yMin).toBe(b.yMin);
  expect(a.width).toBe(b.width);
  expect(a.height).toBe(b.height);
  expect(a.activeCount).toBe(b.activeCount);
  for (let row = 0; row < a.height; row += 1) {
    for (let col = 0; col < a.width; col += 1) {
      expect(a.stateAt(col, row)).toBe(b.stateAt(col, row));
    }
  }
}

describe('2020 Day 17 Part 2 solver', () => {
  it('solves the official 4D example to 848 and matches cycle-by-cycle counts', () => {
    expect(solver.policy).toBe(POCKET_4D_POLICY);
    const seed = solver.parse(OFFICIAL_EXAMPLE);
    const answer = solver.solve(seed);
    expect(answer).toBe(848);
    expect(solver.formatAnswer(answer)).toBe('848');

    const frames = solver.trace(seed);
    expect(frames).toHaveLength(7);
    const expectedCounts = sparse4DCounts(OFFICIAL_EXAMPLE, 6);
    expect(expectedCounts[0]).toBe(5);
    expect(expectedCounts[1]).toBe(29);
    expect(expectedCounts[2]).toBe(60);
    expect(expectedCounts[6]).toBe(848);
    expect(frames.map((f) => f.activeCount)).toEqual(expectedCounts);
  });

  it('solves CRLF-delimited official example to 848', () => {
    const crlf = OFFICIAL_EXAMPLE.replace(/\n/g, '\r\n');
    expect(solver.solve(solver.parse(crlf))).toBe(848);
  });

  it('preserves 4D w <-> -w and z <-> w symmetries across every example frame', () => {
    const frames = solver.trace(solver.parse(OFFICIAL_EXAMPLE));
    for (const frame of frames) {
      for (const slice of frame.slices) {
        const negW = findSlice(frame.slices, slice.z, -slice.w);
        expect(negW).toBeDefined();
        expectMatchingSlices(slice, negW!);

        const swapped = findSlice(frame.slices, slice.w, slice.z);
        expect(swapped).toBeDefined();
        expectMatchingSlices(slice, swapped!);
      }
    }
  });

  it('handles all-inactive and single-cell edge seeds', () => {
    const emptySeed = solver.parse('...\n...');
    expect(solver.solve(emptySeed)).toBe(0);
    const emptyFrames = solver.trace(emptySeed);
    for (const frame of emptyFrames) {
      expect(frame.activeCount).toBe(0);
      expect(frame.slices).toHaveLength(1);
      expect(frame.slices[0]!.z === 0).toBe(true);
      expect(frame.slices[0]!.w === 0).toBe(true);
    }

    const singleSeed = solver.parse('#');
    expect(solver.solve(singleSeed)).toBe(0);
    const singleFrames = solver.trace(singleSeed);
    expect(singleFrames[1]!.activeCount).toBe(0);
    expect(singleFrames[1]!.dyingCount).toBe(1);
  });

  it('matches sparse 4D oracle across 16 seeded PRNG rectangular grids', () => {
    for (let i = 0; i < 16; i += 1) {
      const seedInput = makeRandomSeed(i + 1);
      const cycles = 1 + (i % 3);
      const expected = sparse4DCounts(seedInput, cycles);
      const frames = solver.trace(solver.parse(seedInput));
      for (let c = 0; c <= cycles; c += 1) {
        expect(frames[c]!.activeCount).toBe(expected[c]);
      }
    }
  });

  it('supports bounded trace sampling via maxSteps', () => {
    const seed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.trace(seed, { maxSteps: 3 }).map((f) => f.cycle)).toEqual([0, 3, 6]);
    expect(solver.trace(seed, { maxSteps: 1 }).map((f) => f.cycle)).toEqual([6]);
  });

  it.each([0, -1, 1.5])('rejects invalid maxSteps %s with RangeError', (maxSteps) => {
    const seed = solver.parse(OFFICIAL_EXAMPLE);
    expect(() => solver.trace(seed, { maxSteps })).toThrow(RangeError);
  });

  it.each(['', '\n\n', '#.\n###', '.#.\n.X.', '#.\n\n.#'])('rejects invalid seed %j', (bad) => {
    expect(() => solver.parse(bad)).toThrow(Error);
  });
});
