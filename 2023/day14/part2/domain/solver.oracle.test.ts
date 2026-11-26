import { describe, expect, it } from 'vitest';
import { DishPlatform } from '../../shared';
import { analyzeSpinCycles, solveSpinCycleLoad, solver, spinOnce } from './index';

class SeededRng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  next(): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state / 0x1_0000_0000;
  }

  nextInt(min: number, maxInclusive: number): number {
    return min + Math.floor(this.next() * (maxInclusive - min + 1));
  }
}

function randomDishText(rng: SeededRng, h: number, w: number): string {
  const rows: string[] = [];
  for (let r = 0; r < h; r += 1) {
    let row = '';
    for (let c = 0; c < w; c += 1) {
      const p = rng.next();
      row += p < 0.35 ? 'O' : p < 0.55 ? '#' : '.';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function floydCycle(initial: DishPlatform): {
  readonly cycleStart: number;
  readonly cycleLength: number;
} {
  let tortoise = spinOnce(initial);
  let hare = spinOnce(spinOnce(initial));
  while (tortoise.fingerprint() !== hare.fingerprint()) {
    tortoise = spinOnce(tortoise);
    hare = spinOnce(spinOnce(hare));
  }
  let cycleStart = 0;
  tortoise = initial;
  while (tortoise.fingerprint() !== hare.fingerprint()) {
    tortoise = spinOnce(tortoise);
    hare = spinOnce(hare);
    cycleStart += 1;
  }
  let cycleLength = 1;
  hare = spinOnce(tortoise);
  while (tortoise.fingerprint() !== hare.fingerprint()) {
    hare = spinOnce(hare);
    cycleLength += 1;
  }
  return { cycleStart, cycleLength };
}

function bruteForceLoad(initial: DishPlatform, targetCycles: number): number {
  let current = initial;
  for (let i = 0; i < targetCycles; i += 1) {
    current = spinOnce(current);
  }
  return current.northLoad;
}

const EXAMPLE = [
  'O....#....',
  'O.OO#....#',
  '.....##...',
  'OO.#O....O',
  '.O.....O#.',
  'O.#..O.#.#',
  '..O..#O..O',
  '.......O..',
  '#....###..',
  '#OO..#....',
].join('\n');

describe('2023/day14/part2/domain/solver differential oracle', () => {
  it('matches Floyd tortoise-and-hare and brute-force spinOnce on example, fixed points, and immediate loops', () => {
    const cases = [EXAMPLE, '.', 'O', '#', '...\n...', 'O..\n...\n...', 'O.#\n.#.\n..O'];
    for (const raw of cases) {
      const platform = solver.parse(raw);
      const oracle = floydCycle(platform);
      const analysis = analyzeSpinCycles(platform);
      expect(analysis.cycleStart).toBe(oracle.cycleStart);
      expect(analysis.cycleLength).toBe(oracle.cycleLength);
      for (const target of [0, 1, 2, 5, 13, 37, 50]) {
        expect(solveSpinCycleLoad(platform, target)).toBe(bruteForceLoad(platform, target));
      }
    }
  });

  it('matches Floyd cycle parameters and brute-force loads across 40 seeded random dishes', () => {
    const rng = new SeededRng(20231420);
    for (let i = 0; i < 40; i += 1) {
      const raw = randomDishText(rng, rng.nextInt(1, 9), rng.nextInt(1, 9));
      const platform = solver.parse(raw);
      const oracle = floydCycle(platform);
      const analysis = analyzeSpinCycles(platform);
      expect(analysis.cycleStart).toBe(oracle.cycleStart);
      expect(analysis.cycleLength).toBe(oracle.cycleLength);

      const sampleTarget = rng.nextInt(0, 50);
      expect(solveSpinCycleLoad(platform, sampleTarget)).toBe(
        bruteForceLoad(platform, sampleTarget),
      );
      const projectedEquivalent =
        oracle.cycleStart + ((1_000_000_000 - oracle.cycleStart) % oracle.cycleLength);
      expect(solver.solve(platform)).toBe(bruteForceLoad(platform, projectedEquivalent));
    }
  });
});
