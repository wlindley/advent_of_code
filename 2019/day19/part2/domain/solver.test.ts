import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { EXAMPLE_BEAM_PROGRAM, PART2_SQUARE_SIZE } from '../../shared';
import { solver } from './index';

function compileConeRom(lNum: number, lDen: number, rNum: number, rDen: number): string {
  const cells = EXAMPLE_BEAM_PROGRAM.split(',');
  cells[13] = String(lNum);
  cells[17] = String(lDen);
  cells[29] = String(rDen);
  cells[33] = String(rNum);
  return cells.join(',');
}

function inCone(x: number, y: number, lNum: number, lDen: number, rNum: number, rDen: number): boolean {
  return x >= 0 && y >= 0 && lNum * y <= lDen * x && rDen * x <= rNum * y;
}

function expectedClosestSquare(lNum: number, lDen: number, rNum: number, rDen: number): number {
  const span = PART2_SQUARE_SIZE - 1;
  for (let y = 0; y <= 5000; y += 1) {
    const x = Math.ceil((lNum * (y + span)) / lDen);
    if (
      inCone(x, y, lNum, lDen, rNum, rDen) &&
      inCone(x + span, y, lNum, lDen, rNum, rDen) &&
      inCone(x, y + span, lNum, lDen, rNum, rDen) &&
      inCone(x + span, y + span, lNum, lDen, rNum, rDen)
    ) {
      return x * 10_000 + y;
    }
  }
  throw new Error('No fitting square found in oracle');
}

const CONE_CASES: readonly (readonly [number, number, number, number, number])[] = [
  [0, 1, 1, 2, 198],
  [3, 2, 2, 1, 8_910_495],
  [7, 10, 4, 5, 12_491_685],
  [13, 19, 4, 5, 10_531_440],
];

describe('2019 Day 19 Part 2 solver', () => {
  it('solves the 59-cell example tractor beam program to 2810228', () => {
    expect(compileConeRom(6, 7, 5, 3)).toBe(EXAMPLE_BEAM_PROGRAM);
    const execution = executeSolver(solver, EXAMPLE_BEAM_PROGRAM);
    expect(execution.answer).toBe(2_810_228);
    expect(execution.runtime).toBe('main-thread');
  });

  it('matches the independent 4-corner arithmetic oracle across parametric cone ROMs', () => {
    for (const [lNum, lDen, rNum, rDen, expected] of CONE_CASES) {
      const oracleCode = expectedClosestSquare(lNum, lDen, rNum, rDen);
      expect(oracleCode).toBe(expected);
      const rom = compileConeRom(lNum, lDen, rNum, rDen);
      const execution = executeSolver(solver, rom);
      expect(execution.answer).toBe(oracleCode);
    }
  });

  it('produces bounded square trace frames and handles single-step or default trace options', () => {
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);
    const frames = solver.trace(program, { maxSteps: 8 });
    expect(frames).toHaveLength(8);
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;
    expect(first.kind).toBe('square');
    expect(last.kind).toBe('square');
    if (first.kind === 'square' && last.kind === 'square') {
      expect(first.stepIndex).toBe(1);
      expect(first.phase).toBe('jump');
      expect(first.fits).toBe(false);
      expect(first.candidate).toBeNull();
      expect(last.stepIndex).toBe(last.totalSteps);
      expect(last.phase).toBe('found');
      expect(last.fits).toBe(true);
      expect(last.squareSize).toBe(PART2_SQUARE_SIZE);
      expect(last.anchor.x).toBeGreaterThanOrEqual(0);
      expect(last.leftEdge.length).toBeGreaterThan(0);
      expect(last.probeCount).toBeGreaterThan(0);
      expect(last.probePoint).toEqual({ x: 380, y: 228 });
      expect(last.candidate).toMatchObject({ x: 281, y: 228, rightX: 380, bottomY: 327, answerCode: 2_810_228 });
    }

    const single = solver.trace(program, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.kind).toBe('square');
    if (single[0]?.kind === 'square') expect(single[0].phase).toBe('found');

    const full = solver.trace(program);
    const fullLast = full[full.length - 1]!;
    expect(fullLast.kind).toBe('square');
    if (fullLast.kind === 'square') {
      expect(full).toHaveLength(fullLast.totalSteps);
      expect(fullLast.phase).toBe('found');
    }
  });

  it('rejects malformed programs, invalid trace bounds, and invalid VM outputs quickly', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,bad,99')).toThrow();
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(program, { maxSteps: 1.5 })).toThrow(RangeError);
    const badOutputProgram = solver.parse('3,9,3,10,104,2,99');
    expect(() => solver.solve(badOutputProgram)).toThrow(/0 or 1/);
  });
});
