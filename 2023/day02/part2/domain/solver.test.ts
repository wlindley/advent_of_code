import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { CubeBag, GameRecord, parseGames, type CubeColor } from '../../shared';
import {
  CubePowerTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  solveGames,
  solver,
  traceGames,
} from './index';

const EXAMPLE_INPUT = [
  'Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green',
  'Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue',
  'Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red',
  'Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red',
  'Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green',
].join('\n');

class FakeClock implements Clock {
  private currentMs = 100;

  nowMs(): number {
    this.currentMs += 7;
    return this.currentMs;
  }
}

function streamingPowerOracle(raw: string): number {
  let total = 0;
  for (const line of raw.trim().split(/\r?\n/)) {
    const body = line.slice(line.indexOf(':') + 1);
    let red = 0;
    let green = 0;
    let blue = 0;
    for (const match of body.matchAll(/(\d+)\s+(red|green|blue)/g)) {
      const count = Number(match[1]);
      const color = match[2];
      if (color === 'red' && count > red) red = count;
      else if (color === 'green' && count > green) green = count;
      else if (color === 'blue' && count > blue) blue = count;
    }
    total += red * green * blue;
  }
  return total;
}

function buildRandomGames(count: number): string {
  let seed = 0x20230202;
  const colors: readonly CubeColor[] = ['red', 'green', 'blue'];
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const gameId = i * 5 + (seed % 5) + 1;
    const revealCount = (seed % 4) + 1;
    const reveals: string[] = [];
    for (let r = 0; r < revealCount; r += 1) {
      const clauses: string[] = [];
      for (let c = 0; c < 3; c += 1) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        if ((seed & 3) !== 0 || c === 0) {
          const amount = ((seed >>> 4) % 25) + 1;
          clauses.push(`${amount} ${colors[c]!}`);
        }
      }
      reveals.push(clauses.join(', '));
    }
    lines.push(`Game ${gameId}: ${reveals.join('; ')}`);
  }
  return lines.join('\n');
}

describe('2023 day 02 part 2 solver', () => {
  it('solves the official example to 2286 directly and via executeSolver', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    const games = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(games)).toBe(2286);

    const exec = executeSolver(solver, EXAMPLE_INPUT, new FakeClock());
    expect(exec).toEqual({ answer: 2286, elapsedMs: 7, runtime: 'main-thread' });
  });

  it('computes cross-reveal minimum bag powers with zero channels and arbitrary game IDs', () => {
    const games = parseGames([
      'Game 999: 10 red; 20 green; 30 blue',
      'Game 42: 5 red, 8 green; 3 red',
    ].join('\n'));
    expect(solver.solve(games)).toBe(6000);
    expect(solveGames([])).toBe(0);
    expect(() => solver.parse('')).toThrow(SyntaxError);
  });

  it('throws RangeError on single-game power overflow and running-sum overflow', () => {
    const overflowGame = new GameRecord(1, [new CubeBag(100_000_000, 100_000_000, 1)]);
    expect(() => solveGames([overflowGame])).toThrow(RangeError);
    expect(() => traceGames([overflowGame])).toThrow(RangeError);

    const halfMax = new GameRecord(2, [new CubeBag(50_000_000, 100_000_000, 1)]);
    expect(() => solveGames([halfMax, halfMax])).toThrow(RangeError);
    expect(() => traceGames([halfMax, halfMax])).toThrow(RangeError);
  });

  it('produces frozen trace frames and handles sampling, empty input, and invalid maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const games = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(games);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(5);

    const frame3 = frames[2]!;
    expect(frame3).toBeInstanceOf(CubePowerTraceFrame);
    expect(Object.isFrozen(frame3)).toBe(true);
    expect(frame3.gameIndex).toBe(2);
    expect(frame3.totalGames).toBe(5);
    expect(frame3.minimumBag).toEqual(new CubeBag(20, 13, 6));
    expect(frame3.power).toBe(1560);
    expect(frame3.runningPowerSum).toBe(1620);
    expect(frames[4]!.runningPowerSum).toBe(2286);

    const emptyTrace = traceGames([]);
    expect(Object.isFrozen(emptyTrace)).toBe(true);
    expect(emptyTrace).toEqual([]);

    expect(() => traceGames(games, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceGames(games, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('uniformly samples trace frames while preserving exact final runningPowerSum', () => {
    const manyGames = parseGames(buildRandomGames(260));
    const sampled = solver.trace!(manyGames, { maxSteps: 25 });
    expect(sampled).toHaveLength(25);
    expect(sampled[0]!.gameIndex).toBe(0);
    expect(sampled.at(-1)!.gameIndex).toBe(259);
    expect(sampled.at(-1)!.runningPowerSum).toBe(solveGames(manyGames));

    const single = solver.trace!(manyGames, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.gameIndex).toBe(259);
    expect(single[0]!.runningPowerSum).toBe(solveGames(manyGames));
  });

  it('matches independent regex streaming scanner oracle on 500 LCG games', () => {
    const raw = buildRandomGames(500);
    const games = solver.parse(raw);
    expect(solver.solve(games)).toBe(streamingPowerOracle(raw));
  });
});
