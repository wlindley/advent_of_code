import { describe, expect, it } from 'vitest';
import {
  AREA_SCAN_POLICY,
  CLOSEST_SQUARE_POLICY,
  DEFAULT_MAX_TRACE_STEPS,
  EXAMPLE_BEAM_PROGRAM,
  PART1_GRID_SIZE,
  PART2_SQUARE_SIZE,
  TractorBeamSolver,
} from './beamSolver';

describe('TractorBeamSolver', () => {
  it('solves both Part 1 and Part 2 policies on EXAMPLE_BEAM_PROGRAM', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(PART1_GRID_SIZE).toBe(50);
    expect(PART2_SQUARE_SIZE).toBe(100);

    const part1 = new TractorBeamSolver(AREA_SCAN_POLICY);
    const program1 = part1.parse(EXAMPLE_BEAM_PROGRAM);
    expect(part1.solve(program1)).toBe(674);

    const part2 = new TractorBeamSolver(CLOSEST_SQUARE_POLICY);
    const program2 = part2.parse(EXAMPLE_BEAM_PROGRAM);
    expect(part2.solve(program2)).toBe(2_810_228);
  });

  it('produces bounded trace frames for AREA_SCAN_POLICY', () => {
    const solver = new TractorBeamSolver(AREA_SCAN_POLICY);
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);

    const full = solver.trace(program);
    expect(full).toHaveLength(50);
    expect(full[0]!.kind).toBe('scan');
    expect(AREA_SCAN_POLICY.formatFrameAnswer(full[0]!)).toBe('1');

    const capped = solver.trace(program, { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    const last = capped[capped.length - 1]!;
    expect(last.kind).toBe('scan');
    if (last.kind === 'scan') {
      expect(last.stepIndex).toBe(50);
      expect(last.totalSteps).toBe(50);
      expect(last.affectedCount).toBe(674);
      expect(last.spans).toHaveLength(50);
      expect(AREA_SCAN_POLICY.formatFrameAnswer(last)).toBe('674');
    }
  });

  it('produces bounded trace frames for CLOSEST_SQUARE_POLICY', () => {
    const solver = new TractorBeamSolver(CLOSEST_SQUARE_POLICY);
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);

    const frames = solver.trace(program, { maxSteps: 6 });
    expect(frames).toHaveLength(6);
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;
    expect(first.kind).toBe('square');
    expect(last.kind).toBe('square');
    if (first.kind === 'square' && last.kind === 'square') {
      expect(first.candidate).toBeNull();
      expect(CLOSEST_SQUARE_POLICY.formatFrameAnswer(first)).toBe('—');
      expect(last.fits).toBe(true);
      expect(last.phase).toBe('found');
      expect(last.candidate?.answerCode).toBe(2_810_228);
      expect(CLOSEST_SQUARE_POLICY.formatFrameAnswer(last)).toBe('2810228');
    }
  });

  it('rejects invalid trace maxSteps and invalid Intcode programs', () => {
    const solver = new TractorBeamSolver(AREA_SCAN_POLICY);
    const program = solver.parse(EXAMPLE_BEAM_PROGRAM);
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(program, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
