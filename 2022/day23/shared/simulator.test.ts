import { describe, expect, it } from 'vitest';
import { DiffusionGrid } from './gridBuffer';
import { parseElves } from './parser';
import {
  DEFAULT_MAX_STATIC_ROUNDS,
  DEFAULT_PART1_ROUNDS,
  DEFAULT_TRACE_MAX_STEPS,
  findFirstStaticRound,
  simulateRounds,
  traceFixedRounds,
  traceUntilStatic,
} from './simulator';
import type { ElfCoord } from './types';

const FIVE_ELVES = parseElves(['.....', '..##.', '..#..', '.....', '..##.', '.....'].join('\n'));
const OFFICIAL_22 = parseElves([
  '....#..', '..###.#', '#...#.#', '.#...##', '#.###..', '##.#.##', '.#..#..',
].join('\n'));

const DIRS: readonly (readonly [number, number])[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const WEDGES: readonly (readonly (readonly [number, number])[])[] = [
  [[-1, -1], [-1, 0], [-1, 1]],
  [[1, -1], [1, 0], [1, 1]],
  [[-1, -1], [0, -1], [1, -1]],
  [[-1, 1], [0, 1], [1, 1]],
];

function oracleStep(elves: ElfCoord[], round: number): { next: ElfCoord[]; moved: number } {
  const occupied = new Set(elves.map((e) => `${e.row},${e.col}`));
  const props = new Array<{ r: number; c: number } | null>(elves.length).fill(null);
  const counts = new Map<string, number>();
  for (let i = 0; i < elves.length; i += 1) {
    const e = elves[i]!;
    let anyNeighbor = false;
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if ((dr !== 0 || dc !== 0) && occupied.has(`${e.row + dr},${e.col + dc}`)) anyNeighbor = true;
      }
    }
    if (!anyNeighbor) continue;
    for (let k = 0; k < 4; k += 1) {
      const dir = (round - 1 + k) & 3;
      if (WEDGES[dir]!.every(([dr, dc]) => !occupied.has(`${e.row + dr},${e.col + dc}`))) {
        const nr = e.row + DIRS[dir]![0];
        const nc = e.col + DIRS[dir]![1];
        props[i] = { r: nr, c: nc };
        const key = `${nr},${nc}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        break;
      }
    }
  }
  let moved = 0;
  const next = elves.map((e, i) => {
    const p = props[i];
    if (!p || counts.get(`${p.r},${p.c}`) !== 1) return e;
    moved += 1;
    return { row: p.r, col: p.c };
  });
  return { next, moved };
}

function oracleVerify(elves: readonly ElfCoord[], maxRounds: number): void {
  let state = elves.map((e) => ({ ...e }));
  const grid = new DiffusionGrid(elves, 2);
  for (let r = 1; r <= maxRounds; r += 1) {
    const step = oracleStep(state, r);
    const summary = grid.stepRound(r);
    expect(summary.movedCount).toBe(step.moved);
    const frame = grid.toFrame(summary);
    const actual = Array.from(frame.elfRows, (row, i) => `${row},${frame.elfCols[i]}`).sort();
    const expected = step.next.map((e) => `${e.row},${e.col}`).sort();
    expect(actual).toEqual(expected);
    state = step.next;
    if (step.moved === 0) break;
  }
}

describe('Day 23 simulator', () => {
  it('solves official 5-elf and 22-elf examples for Part 1 and Part 2', () => {
    expect(DEFAULT_PART1_ROUNDS).toBe(10);
    expect(DEFAULT_MAX_STATIC_ROUNDS).toBe(100_000);
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(48);

    const p1Small = simulateRounds(FIVE_ELVES, DEFAULT_PART1_ROUNDS);
    expect(p1Small.emptyGroundCount).toBe(25);
    expect(p1Small.reachedStatic).toBe(true);
    expect(p1Small.roundsCompleted).toBe(4);
    expect(findFirstStaticRound(FIVE_ELVES, DEFAULT_MAX_STATIC_ROUNDS)).toBe(4);

    const p1Full = simulateRounds(OFFICIAL_22, DEFAULT_PART1_ROUNDS);
    expect(p1Full.emptyGroundCount).toBe(110);
    expect(p1Full.reachedStatic).toBe(false);
    expect(p1Full.roundsCompleted).toBe(10);
    expect(findFirstStaticRound(OFFICIAL_22, DEFAULT_MAX_STATIC_ROUNDS)).toBe(20);
  });

  it('matches independent Set/Map oracle round-by-round on examples, collisions, and random grids', () => {
    oracleVerify(FIVE_ELVES, 10);
    oracleVerify(OFFICIAL_22, 22);
    oracleVerify([{ row: 0, col: 0 }, { row: 2, col: 0 }, { row: 0, col: 1 }, { row: 2, col: 1 }], 15);
    let seed = 0x1234abcd;
    for (let t = 0; t < 4; t += 1) {
      const pts: ElfCoord[] = [];
      for (let r = 0; r < 6; r += 1) {
        for (let c = 0; c < 6; c += 1) {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          if ((seed & 3) === 0) pts.push({ row: r, col: c });
        }
      }
      if (pts.length > 0) oracleVerify(pts, 15);
    }
  });

  it('produces bounded traces for fixed rounds and until-static runs', () => {
    const fixedZero = traceFixedRounds(OFFICIAL_22, 0);
    expect(fixedZero).toHaveLength(1);
    expect(fixedZero[0]!.round).toBe(0);

    const fixedAll = traceFixedRounds(OFFICIAL_22, 10);
    expect(fixedAll).toHaveLength(11);
    expect(fixedAll[10]!.emptyGroundCount).toBe(110);

    const fixedCapped = traceFixedRounds(OFFICIAL_22, 10, { maxSteps: 4 });
    expect(fixedCapped.map((f) => f.round)).toEqual([0, 3, 7, 10]);

    const fixedOne = traceFixedRounds(OFFICIAL_22, 10, { maxSteps: 1 });
    expect(fixedOne).toHaveLength(1);
    expect(fixedOne[0]!.round).toBe(10);

    const staticFull = traceUntilStatic(OFFICIAL_22, 50);
    expect(staticFull).toHaveLength(21);
    expect(staticFull[20]!.round).toBe(20);
    expect(staticFull[20]!.isStatic).toBe(true);

    const staticCapped = traceUntilStatic(OFFICIAL_22, 50, { maxSteps: 5 });
    expect(staticCapped).toHaveLength(5);
    expect(staticCapped[0]!.round).toBe(0);
    expect(staticCapped[4]!.round).toBe(20);
  });

  it('validates simulator bounds and maxRounds errors', () => {
    expect(() => simulateRounds(OFFICIAL_22, -1)).toThrow(RangeError);
    expect(() => simulateRounds(OFFICIAL_22, 1.5)).toThrow(RangeError);
    expect(() => findFirstStaticRound(OFFICIAL_22, 0)).toThrow(RangeError);
    expect(() => findFirstStaticRound(OFFICIAL_22, 1.5)).toThrow(RangeError);
    expect(() => findFirstStaticRound(OFFICIAL_22, 5)).toThrow(/within 5 rounds/);
    expect(() => traceFixedRounds(OFFICIAL_22, -1)).toThrow(RangeError);
    expect(() => traceFixedRounds(OFFICIAL_22, 10, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceUntilStatic(OFFICIAL_22, 5)).toThrow(/within 5 rounds/);
  });
});
