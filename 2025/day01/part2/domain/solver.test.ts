import { describe, expect, it } from 'vitest';
import { DIAL_SIZE, INITIAL_DIAL_POSITION, Rotation } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, DialClickTraceFrame, solver } from './index';

const EXAMPLE_INPUT = 'L68\nL30\nR48\nL5\nR60\nL55\nL1\nL99\nR14\nL82';

describe('2025 day 01 part 2 solver', () => {
  it('solves the official example input to 6 and traces key steps', () => {
    const rotations = solver.parse(EXAMPLE_INPUT);
    expect(rotations).toHaveLength(10);
    expect(solver.solve(rotations)).toBe(6);

    const frames = solver.trace!(rotations);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(250);
    expect(frames).toHaveLength(11);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]).toBeInstanceOf(DialClickTraceFrame);

    expect([frames[0]?.step, frames[0]?.fromPosition, frames[0]?.toPosition, frames[0]?.stepZeroHits, frames[0]?.landedOnZero, frames[0]?.midRotationHits, frames[0]?.fullTurns, frames[0]?.totalZeroHits]).toEqual([0, 50, 50, 0, false, 0, 0, 0]);
    expect([frames[1]?.fromPosition, frames[1]?.toPosition, frames[1]?.stepZeroHits, frames[1]?.landedOnZero, frames[1]?.midRotationHits, frames[1]?.totalZeroHits]).toEqual([50, 82, 1, false, 1, 1]);
    expect([frames[3]?.fromPosition, frames[3]?.toPosition, frames[3]?.stepZeroHits, frames[3]?.landedOnZero, frames[3]?.midRotationHits, frames[3]?.totalZeroHits]).toEqual([52, 0, 1, true, 0, 2]);
    expect([frames[4]?.fromPosition, frames[4]?.toPosition, frames[4]?.stepZeroHits, frames[4]?.totalZeroHits]).toEqual([0, 95, 0, 2]);
    expect([frames[10]?.toPosition, frames[10]?.totalZeroHits]).toEqual([32, 6]);
  });

  it('handles multi-turn, pass-plus-land, consecutive hits, and empty input', () => {
    expect(solver.solve([new Rotation('R', 1000)])).toBe(10);
    expect(solver.solve([new Rotation('L', 150)])).toBe(2);
    const l150 = solver.trace!([new Rotation('L', 150)])[1]!;
    expect(l150.fullTurns).toBe(1);
    expect(l150.midRotationHits).toBe(1);
    expect(l150.landedOnZero).toBe(true);

    expect(solver.solve([new Rotation('R', 50), new Rotation('L', 100), new Rotation('R', 200)])).toBe(4);
    expect(solver.solve([])).toBe(0);

    for (const opts of [undefined, { maxSteps: 1 }] as const) {
      const empty = solver.trace!([], opts);
      expect(empty).toHaveLength(1);
      expect(empty[0]?.step).toBe(0);
      expect(empty[0]?.totalZeroHits).toBe(0);
    }
  });

  it('samples large traces, avoids duplicate final frame, and handles maxSteps = 1', () => {
    const rotations = Array.from({ length: 500 }, () => new Rotation('R', 1));
    const sampled = solver.trace!(rotations, { maxSteps: 50 });
    expect(sampled.length).toBeLessThanOrEqual(50);
    expect(sampled[0]?.step).toBe(0);
    expect(sampled[sampled.length - 1]?.step).toBe(500);
    expect(sampled[sampled.length - 1]?.totalZeroHits).toBe(5);

    const nine = Array.from({ length: 9 }, () => new Rotation('R', 10));
    expect(solver.trace!(nine, { maxSteps: 4 }).map((f) => f.step)).toEqual([0, 3, 6, 9]);

    const single = solver.trace!(nine, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.step).toBe(9);
    expect(single[0]?.toPosition).toBe(40);
  });

  it('rejects invalid maxSteps values', () => {
    const rotations = [new Rotation('R', 1)];
    for (const bad of [0, -2, 2.5, Number.NaN]) {
      expect(() => solver.trace!(rotations, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches click-by-click oracle across a 40-rotation mixed sequence', () => {
    const seq = Array.from({ length: 40 }, (_, i) =>
      new Rotation(i % 2 === 0 ? 'L' : 'R', ((i * 37) % 250) + 1),
    );
    let pos = INITIAL_DIAL_POSITION;
    let oracleHits = 0;
    for (const r of seq) {
      const delta = r.direction === 'R' ? 1 : -1;
      for (let c = 0; c < r.distance; c += 1) {
        pos = (pos + delta + DIAL_SIZE) % DIAL_SIZE;
        if (pos === 0) oracleHits += 1;
      }
    }
    expect(solver.solve(seq)).toBe(oracleHits);
    const frames = solver.trace!(seq);
    expect(frames[frames.length - 1]?.totalZeroHits).toBe(oracleHits);
    expect(frames[frames.length - 1]?.toPosition).toBe(pos);
  });
});
