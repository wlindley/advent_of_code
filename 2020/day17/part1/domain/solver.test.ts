import { describe, expect, it } from 'vitest';
import { POCKET_3D_POLICY } from '../../shared';
import { solver } from './solver';

const OFFICIAL_EXAMPLE = '.#.\n..#\n###';

function sparse3DSimulate(raw: string, cycles: number): number {
  const rows = raw.trim().split('\n');
  let active = new Set<string>();
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y]!;
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '#') active.add(`${x},${y},0`);
    }
  }
  for (let c = 0; c < cycles; c += 1) {
    const counts = new Map<string, number>();
    for (const key of active) {
      const [x = 0, y = 0, z = 0] = key.split(',').map(Number);
      for (let dz = -1; dz <= 1; dz += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0 && dz === 0) continue;
            const nk = `${x + dx},${y + dy},${z + dz}`;
            counts.set(nk, (counts.get(nk) ?? 0) + 1);
          }
        }
      }
    }
    const next = new Set<string>();
    for (const [k, n] of counts) {
      if (n === 3 || (n === 2 && active.has(k))) next.add(k);
    }
    active = next;
  }
  return active.size;
}

describe('2020 Day 17 Part 1 solver', () => {
  it('solves the official 3D example to 112 and formats the answer', () => {
    expect(solver.policy).toBe(POCKET_3D_POLICY);
    const seed = solver.parse(OFFICIAL_EXAMPLE);
    const answer = solver.solve(seed);
    expect(answer).toBe(112);
    expect(solver.formatAnswer(answer)).toBe('112');

    const frames = solver.trace(seed);
    expect(frames).toHaveLength(7);
    expect(frames.at(-1)?.activeCount).toBe(112);
  });

  it('matches the sparse 3D oracle on a rectangular asymmetric seed', () => {
    const seedInput = '#..#\n.#..\n..##\n#.#.';
    const seed = solver.parse(seedInput);
    expect(solver.solve(seed)).toBe(sparse3DSimulate(seedInput, 6));
  });
});
