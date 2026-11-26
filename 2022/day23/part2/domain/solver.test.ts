import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const SMALL_FIVE = '.....\n..##.\n..#..\n.....\n..##.\n.....';
const OFFICIAL_22 = '....#..\n..###.#\n#...#.#\n.#...##\n#.###..\n##.#.##\n.#..#..';
const O_DR = [-1, 1, 0, 0] as const;
const O_DC = [0, 0, -1, 1] as const;
const O_CHECKS: readonly (readonly [number, number][])[] = [
  [[-1, -1], [-1, 0], [-1, 1]],
  [[1, -1], [1, 0], [1, 1]],
  [[-1, -1], [0, -1], [1, -1]],
  [[-1, 1], [0, 1], [1, 1]],
];

function oracleParse(raw: string): Set<string> {
  const set = new Set<string>();
  const lines = raw.split('\n');
  for (let r = 0; r < lines.length; r += 1) {
    const row = lines[r]!;
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] === '#') set.add(`${r},${c}`);
    }
  }
  return set;
}

function oracleChooseDir(elves: Set<string>, r: number, c: number, round: number): number {
  let hasNeighbor = false;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if ((dr !== 0 || dc !== 0) && elves.has(`${r + dr},${c + dc}`)) hasNeighbor = true;
    }
  }
  if (!hasNeighbor) return -1;
  for (let k = 0; k < 4; k += 1) {
    const dir = (round - 1 + k) & 3;
    const ch = O_CHECKS[dir]!;
    let blocked = false;
    for (let i = 0; i < 3; i += 1) if (elves.has(`${r + ch[i]![0]},${c + ch[i]![1]}`)) blocked = true;
    if (!blocked) return dir;
  }
  return -1;
}

function oracleStep(elves: Set<string>, round: number): { next: Set<string>; moved: number } {
  const proposals: [string, string][] = [];
  const counts = new Map<string, number>();
  const next = new Set<string>();
  for (const key of elves) {
    const sep = key.indexOf(',');
    const r = Number(key.slice(0, sep));
    const c = Number(key.slice(sep + 1));
    const dir = oracleChooseDir(elves, r, c, round);
    if (dir < 0) { next.add(key); continue; }
    const target = `${r + O_DR[dir]!},${c + O_DC[dir]!}`;
    proposals.push([key, target]);
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  let moved = 0;
  for (const [key, target] of proposals) {
    if (counts.get(target) === 1) { next.add(target); moved += 1; } else next.add(key);
  }
  return { next, moved };
}

function oracleFirstStaticRound(raw: string): number {
  let elves = oracleParse(raw);
  for (let round = 1; round <= 10_000; round += 1) {
    const step = oracleStep(elves, round);
    if (step.moved === 0) return round;
    elves = step.next;
  }
  throw new Error('Oracle did not stabilize within 10000 rounds');
}

function seededGrid(seed: number, size: number): string {
  let s = seed >>> 0;
  const rows: string[] = [];
  let hasElf = false;
  for (let r = 0; r < size; r += 1) {
    let line = '';
    for (let c = 0; c < size; c += 1) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const ch = (s & 3) === 0 ? '#' : '.';
      if (ch === '#') hasElf = true;
      line += ch;
    }
    rows.push(line);
  }
  if (!hasElf) rows[0] = `#${rows[0]!.slice(1)}`;
  return rows.join('\n');
}

class FakeClock implements Clock {
  private idx = 0;
  constructor(private readonly times: readonly number[]) {}
  nowMs(): number {
    const value = this.times[this.idx] ?? this.times[this.times.length - 1] ?? 0;
    this.idx += 1;
    return value;
  }
}

describe('Day 23 Part 2 solver', () => {
  it('solves the official 22-elf example via executeSolver and matches oracle', () => {
    const exec = executeSolver(solver, OFFICIAL_22, new FakeClock([10, 22.5]));
    expect(exec.answer).toBe(20);
    expect(exec.elapsedMs).toBe(12.5);
    expect(exec.runtime).toBe('main-thread');
    expect(exec.answer).toBe(oracleFirstStaticRound(OFFICIAL_22));
  });

  it('matches oracle on 5-elf, single-elf, N/S & E/W head-on collisions, and 8 seeded grids', () => {
    expect(solver.solve(solver.parse(SMALL_FIVE))).toBe(4);
    expect(solver.solve(solver.parse('#'))).toBe(1);
    for (const grid of ['#.#\n.#.\n...\n.#.\n#.#', '#...#\n.#.#.\n#...#']) {
      const elves = solver.parse(grid);
      expect(solver.trace(elves)[1]!.collisionCount).toBeGreaterThanOrEqual(1);
      expect(solver.solve(elves)).toBe(oracleFirstStaticRound(grid));
    }
    for (let seed = 1; seed <= 8; seed += 1) {
      const grid = seededGrid(seed * 7919, 6);
      expect(solver.solve(solver.parse(grid))).toBe(oracleFirstStaticRound(grid));
    }
  });

  it('produces default and bounded traces ending at static round 20', () => {
    const elves = solver.parse(OFFICIAL_22);
    const full = solver.trace(elves);
    expect(full).toHaveLength(21);
    expect(full[0]!.round).toBe(0);
    expect(full[20]!.round).toBe(20);
    expect(full[20]!.isStatic).toBe(true);
    expect(full[20]!.movedCount).toBe(0);
    const capped = solver.trace(elves, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(capped[0]!.round).toBe(0);
    expect(capped[4]!.round).toBe(20);
    expect(capped[4]!.isStatic).toBe(true);
    const single = solver.trace(elves, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.round).toBe(20);
  });

  it('rejects invalid puzzle inputs and invalid maxSteps individually', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('...\n...')).toThrow();
    expect(() => solver.parse('#\n\n#')).toThrow();
    expect(() => solver.parse('#x#')).toThrow();
    expect(() => solver.trace(solver.parse('#'), { maxSteps: 0 })).toThrow(RangeError);
  });
});
