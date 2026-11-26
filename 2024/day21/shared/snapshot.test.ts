import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { KeypadConfig, PART1_DIRECTIONAL_ROBOTS, PART2_DIRECTIONAL_ROBOTS } from './model';
import { parseDoorCodes } from './parser';
import {
  DEFAULT_MAX_RECONSTRUCT_LENGTH,
  DEFAULT_MAX_TRACE_STEPS,
  KeypadConundrumSnapshot,
  buildKeypadTrace,
  createKeypadConundrumSolver,
} from './snapshot';

const OFFICIAL_EXAMPLE = '029A\n980A\n179A\n456A\n379A';

describe('buildKeypadTrace and KeypadConundrumSnapshot', () => {
  it('builds table, code, and complete frames with dynamic activeEntry and revealedComplexity', () => {
    const codes = parseDoorCodes(OFFICIAL_EXAMPLE);
    const config = new KeypadConfig(PART1_DIRECTIONAL_ROBOTS);
    const frames = buildKeypadTrace(codes, config);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(64);
    expect(DEFAULT_MAX_RECONSTRUCT_LENGTH).toBe(512);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(3 + 5 + 1);

    const first = frames[0]!;
    expect(first).toBeInstanceOf(KeypadConundrumSnapshot);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.phase).toBe('table');
    expect(first.activeDepth).toBe(0);
    expect(first.activeEntry).toBeNull();
    expect(first.revealedComplexity).toBe(0n);

    const firstCodeFrame = frames[3]!;
    expect(firstCodeFrame.phase).toBe('code');
    expect(firstCodeFrame.activeDepth).toBe(2);
    expect(firstCodeFrame.activeEntry?.code.raw).toBe('029A');
    expect(firstCodeFrame.revealedComplexity).toBe(1972n);
    expect(firstCodeFrame.activeNumericSeq?.length).toBe(12);
    expect(firstCodeFrame.activeLayers).toHaveLength(3);

    const last = frames[frames.length - 1]!;
    expect(last.phase).toBe('complete');
    expect(last.activeEntry?.code.raw).toBe('379A');
    expect(last.revealedComplexity).toBe(126384n);
  });

  it('bounds trace frames with maxSteps and truncates large reconstructions cleanly', () => {
    const codes = parseDoorCodes(OFFICIAL_EXAMPLE);
    const config1 = new KeypadConfig(PART1_DIRECTIONAL_ROBOTS);

    const single = buildKeypadTrace(codes, config1, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.phase).toBe('complete');

    const capped = buildKeypadTrace(codes, config1, { maxSteps: 4 });
    expect(capped).toHaveLength(4);
    expect(capped[0]!.phase).toBe('table');
    expect(capped[3]!.phase).toBe('complete');

    const p2Frames = buildKeypadTrace(codes, new KeypadConfig(PART2_DIRECTIONAL_ROBOTS), { maxSteps: 6 });
    expect(p2Frames).toHaveLength(6);
    const p2Complete = p2Frames[5]!;
    expect(p2Complete.activeNumericSeq).not.toBeNull();
    expect(p2Complete.activeLayers).toBeNull();

    expect(() => buildKeypadTrace([], config1)).toThrow(RangeError);
    expect(() => buildKeypadTrace(codes, config1, { maxSteps: 0 })).toThrow(RangeError);
  });
});

describe('createKeypadConundrumSolver', () => {
  it('executes parse, solve, and trace via shared executeSolver', () => {
    const solver = createKeypadConundrumSolver(new KeypadConfig(PART1_DIRECTIONAL_ROBOTS));
    const run = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(run.answer).toBe(126384n);
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.trace!(parsed, { maxSteps: 3 })).toHaveLength(3);
  });
});
