import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { HIGHEST_SEAT_POLICY, MISSING_INTERIOR_SEAT_POLICY } from './policy';
import { BoardingPass } from './seat';
import { BoardingSolver } from './solver';

describe('BoardingSolver', () => {
  it('parses, solves, and traces using the configured SeatQueryPolicy', () => {
    const solver = new BoardingSolver(HIGHEST_SEAT_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(HIGHEST_SEAT_POLICY);

    const raw = 'FBFBBFFRLR\nBFFFBBFRRR\nFFFBBBFRRR\nBBFFBBFRLL';
    const manifest = solver.parse(raw);
    expect(solver.solve(manifest)).toBe(820);
    expect(executeSolver(solver, raw).answer).toBe(820);

    const defaultTrace = solver.trace(manifest);
    expect(defaultTrace).toHaveLength(15);
    const cappedTrace = solver.trace(manifest, { maxSteps: 6 });
    expect(cappedTrace).toHaveLength(6);
  });

  it('supports MissingInteriorSeatPolicy and propagates parse/query errors', () => {
    const solver = new BoardingSolver(MISSING_INTERIOR_SEAT_POLICY);
    const raw = [10, 11, 13, 14].map((id) => new BoardingPass(id).code).join('\n');
    expect(solver.solve(solver.parse(raw))).toBe(12);

    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('BADPASS123')).toThrow(SyntaxError);
    expect(() => solver.solve(solver.parse('FBFBBFFRLR'))).toThrow(RangeError);
  });
});
