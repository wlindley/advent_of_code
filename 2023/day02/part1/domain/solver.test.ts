import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { CubeBag, parseGames, type CubeColor } from '../../shared';
import {
  CubeGameTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  PART1_LIMITS,
  solveGames,
  solver,
  traceGames,
} from './index';

const EXAMPLE_INPUT = `Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green`;

function shortCircuitRevealOracle(raw: string, limits: readonly [number, number, number]): number {
  let sum = 0;
  for (const line of raw.trim().split(/\r?\n/)) {
    const colon = line.indexOf(':');
    const id = Number(line.slice(5, colon).trim());
    let possible = true;
    for (const reveal of line.slice(colon + 1).split(';')) {
      for (const clause of reveal.split(',')) {
        const [countText, color] = clause.trim().split(/\s+/);
        const count = Number(countText);
        const limit = color === 'red' ? limits[0] : color === 'green' ? limits[1] : limits[2];
        if (count > limit) {
          possible = false;
          break;
        }
      }
      if (!possible) break;
    }
    if (possible) sum += id;
  }
  return sum;
}

function buildRandomGames(count: number): string {
  let seed = 0x20230201;
  const colors: readonly CubeColor[] = ['red', 'green', 'blue'];
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const gameId = i * 3 + (seed % 3) + 1;
    const revealCount = (seed % 4) + 1;
    const reveals: string[] = [];
    for (let r = 0; r < revealCount; r += 1) {
      const clauses: string[] = [];
      for (let c = 0; c < 3; c += 1) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        if ((seed & 3) !== 0 || c === 0) {
          const amount = ((seed >>> 4) % 16) + 1;
          clauses.push(`${amount} ${colors[c]!}`);
        }
      }
      reveals.push(clauses.join(', '));
    }
    lines.push(`Game ${gameId}: ${reveals.join('; ')}`);
  }
  return lines.join('\n');
}

describe('2023 day 02 part 1 solver', () => {
  it('solves the official example to 8 directly and via executeSolver', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    expect(PART1_LIMITS).toEqual(new CubeBag(12, 13, 14));

    const games = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(games)).toBe(8);

    let tick = 100;
    const exec = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => (tick += 7) });
    expect(exec).toEqual({ answer: 8, elapsedMs: 7, runtime: 'main-thread' });
  });

  it('enforces exact 12/13/14 vs +1 breach boundaries and sums arbitrary game IDs', () => {
    const boundaryInput = [
      'Game 17: 12 red, 13 green, 14 blue',
      'Game 25: 13 red, 13 green, 14 blue',
      'Game 42: 12 red, 14 green, 14 blue',
      'Game 99: 12 red, 13 green, 15 blue',
      'Game 105: 5 red; 6 green; 7 blue',
    ].join('\n');

    const games = parseGames(boundaryInput);
    expect(solver.solve(games)).toBe(17 + 105);
  });

  it('produces frozen trace frames with dynamic getters and handles sampling, empty, and invalid maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const games = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(games);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(5);

    const frame3 = frames[2]!;
    expect(frame3).toBeInstanceOf(CubeGameTraceFrame);
    expect(Object.isFrozen(frame3)).toBe(true);
    expect(frame3.gameIndex).toBe(2);
    expect(frame3.totalGames).toBe(5);
    expect(frame3.peakBag).toEqual(new CubeBag(20, 13, 6));
    expect(frame3.isPossible).toBe(false);
    expect(frame3.exceededColors).toEqual(['red']);
    expect(frame3.runningSum).toBe(3);
    expect(frame3.possibleCount).toBe(2);

    const lastFrame = frames[4]!;
    expect(lastFrame.isPossible).toBe(true);
    expect(lastFrame.exceededColors).toEqual([]);
    expect(lastFrame.runningSum).toBe(8);
    expect(lastFrame.possibleCount).toBe(3);

    const emptyTrace = traceGames([], PART1_LIMITS);
    expect(Object.isFrozen(emptyTrace)).toBe(true);
    expect(emptyTrace).toEqual([]);

    expect(() => traceGames(games, PART1_LIMITS, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceGames(games, PART1_LIMITS, { maxSteps: 1.5 })).toThrow(RangeError);

    const manyGames = parseGames(buildRandomGames(260));
    const sampled = solver.trace!(manyGames, { maxSteps: 25 });
    expect(sampled).toHaveLength(25);
    expect(sampled.at(-1)?.runningSum).toBe(solveGames(manyGames, PART1_LIMITS));
  });

  it('matches standalone short-circuit reveal oracle on 500 PRNG games', () => {
    const raw = buildRandomGames(500);
    const games = solver.parse(raw);
    expect(solver.solve(games)).toBe(shortCircuitRevealOracle(raw, [12, 13, 14]));
  });
});
