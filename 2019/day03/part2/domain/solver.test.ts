import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const DIRS = ['U', 'D', 'L', 'R'] as const;
const EX1 = 'R8,U5,L5,D3\nU7,R6,D4,L4';
const EX2 = 'R75,D30,R83,U83,L12,D49,R71,U7,L72\nU62,R66,U55,R34,D71,R55,D58,R83';
const EX3 = 'R98,U47,R26,D63,R33,U87,L62,D20,R33,U53,R51\nU98,R91,D20,R16,D67,R40,U7,R15,U6,R7';

interface PrngState {
  seed: number;
}

function nextRand(state: PrngState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed;
}

function generateWirePath(state: PrngState, count: number): string {
  const tokens: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const dir = DIRS[nextRand(state) % 4]!;
    const dist = (nextRand(state) % 6) + 1;
    tokens.push(`${dir}${dist}`);
  }
  return tokens.join(',');
}

function walkWireGrid(line: string): Map<string, number> {
  const visited = new Map<string, number>();
  let x = 0;
  let y = 0;
  let steps = 0;
  for (const token of line.split(',')) {
    const dir = token[0]!;
    const dist = Number(token.slice(1));
    const dx = dir === 'R' ? 1 : dir === 'L' ? -1 : 0;
    const dy = dir === 'U' ? 1 : dir === 'D' ? -1 : 0;
    for (let s = 0; s < dist; s += 1) {
      x += dx;
      y += dy;
      steps += 1;
      if (x !== 0 || y !== 0) {
        const key = `${x},${y}`;
        if (!visited.has(key)) visited.set(key, steps);
      }
    }
  }
  return visited;
}

function oracleMinSignalDelay(raw: string): bigint | null {
  const [line1, line2] = raw.split('\n');
  const first = walkWireGrid(line1!);
  const second = walkWireGrid(line2!);
  let minDelay: bigint | null = null;
  for (const [key, s1] of first.entries()) {
    const s2 = second.get(key);
    if (s2 === undefined) continue;
    const delay = BigInt(s1 + s2);
    if (minDelay === null || delay < minDelay) minDelay = delay;
  }
  return minDelay;
}

function assertSolveThrows(raw: string, expectedMsg: string): void {
  let caught: unknown = null;
  try {
    executeSolver(solver, raw);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(Error);
  expect((caught as Error).message).toContain(expectedMsg);
}

function assertParseThrows(raw: string): void {
  let caught: unknown = null;
  try {
    solver.parse(raw);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(Error);
}

describe('2019 Day 3 Part 2 solver', () => {
  it('solves all three official AoC Part 2 examples via executeSolver', () => {
    expect(executeSolver(solver, EX1).answer).toBe(30n);
    expect(executeSolver(solver, EX2).answer).toBe(610n);
    expect(executeSolver(solver, EX3).answer).toBe(410n);
  });

  it('tracks trace progression and Manhattan-vs-signal-delay divergence on Example 1', () => {
    const parsed = solver.parse(EX1);
    const fullTrace = solver.trace(parsed);
    expect(fullTrace).toHaveLength(4);
    expect(fullTrace[0]!.bestCrossing).toBeNull();
    expect(fullTrace[1]!.bestCrossing).toBeNull();

    const step2Best = fullTrace[2]!.bestCrossing!;
    expect(step2Best.point).toEqual({ x: 6n, y: 5n });
    expect(step2Best.signalDelay).toBe(30n);
    expect(step2Best.manhattanDistance).toBe(11n);

    expect(fullTrace[3]!.discoveredCrossings).toHaveLength(2);
    const secondFound = fullTrace[3]!.discoveredCrossings[1]!;
    expect(secondFound.point).toEqual({ x: 3n, y: 3n });
    expect(secondFound.signalDelay).toBe(40n);
    expect(secondFound.manhattanDistance).toBe(6n);
    expect(fullTrace[3]!.bestCrossing!.point).toEqual({ x: 6n, y: 5n });
    expect(fullTrace[3]!.bestCrossing!.signalDelay).toBe(30n);

    const capped = solver.trace(parsed, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped[1]!.stepIndex).toBe(3);
    expect(capped[1]!.bestCrossing!.signalDelay).toBe(30n);
  });

  it('uses earliest visit steps on symmetric self-crossing wires', () => {
    const raw = 'R4,U2,L2,D2\nD3,R2,U3,D2,R2,U1,L2,U1';
    expect(executeSolver(solver, raw).answer).toBe(10n);
  });

  it('handles same-direction and opposite-direction collinear overlaps', () => {
    expect(executeSolver(solver, 'R5\nR3').answer).toBe(2n);
    expect(executeSolver(solver, 'U2,R6\nR6,U2,L6').answer).toBe(16n);
  });

  it('handles 10^20 BigInt signal delays without precision loss', () => {
    const d = '100000000000000000000';
    expect(executeSolver(solver, `R${d},U${d}\nU${d},R${d}`).answer).toBe(400000000000000000000n);
  });

  it('throws when wires never cross', () => {
    assertSolveThrows('R5,U5\nL5,D5', 'No wire crossings found');
  });

  it('throws when input has only a single wire', () => {
    assertParseThrows('R5,U5');
  });

  it('throws when a wire move has zero distance', () => {
    assertParseThrows('R0,U5\nU5,R5');
  });

  it('throws when input is empty', () => {
    assertParseThrows('');
  });

  it('matches unit-step grid-walk oracle across 30 seeded PRNG pairs', () => {
    const state: PrngState = { seed: 20190302 };
    for (let trial = 0; trial < 30; trial += 1) {
      const raw = `${generateWirePath(state, 16)}\n${generateWirePath(state, 16)}`;
      const expected = oracleMinSignalDelay(raw);
      if (expected === null) {
        assertSolveThrows(raw, 'No wire crossings found');
      } else {
        expect(executeSolver(solver, raw).answer).toBe(expected);
      }
    }
  });
});
