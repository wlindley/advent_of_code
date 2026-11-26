import { describe, expect, it } from 'vitest';
import { TumblerInventory, TumblerSchematic, parseSchematics } from './schematic';
import { PairFitEvaluation } from './matcher';
import {
  DEFAULT_MAX_TRACE_STEPS,
  TumblerTraceFrame,
  buildMatchTrace,
} from './trace';

const EXAMPLE = [
  '#####\n.####\n.####\n.####\n.#.#.\n.#...\n.....',
  '#####\n##.##\n.#.##\n...##\n...#.\n...#.\n.....',
  '.....\n#....\n#....\n#...#\n#.#.#\n#.###\n#####',
  '.....\n.....\n#.#..\n###..\n###.#\n###.#\n#####',
  '.....\n.....\n.....\n#....\n#.#..\n#.#.#\n#####',
].join('\n\n');

describe('TumblerTraceFrame', () => {
  it('computes dynamic progress, phase, reject count, and fit rate', () => {
    const inv = parseSchematics(EXAMPLE);
    const eval01 = new PairFitEvaluation(inv.locks[0]!, inv.keys[1]!, 0, 1);
    const midFrame = new TumblerTraceFrame(inv, eval01, 0);

    expect(Object.isFrozen(midFrame)).toBe(true);
    expect(midFrame.pairIndex).toBe(1);
    expect(midFrame.testedCount).toBe(2);
    expect(midFrame.totalPairs).toBe(6);
    expect(midFrame.rejectCount).toBe(2);
    expect(midFrame.isComplete).toBe(false);
    expect(midFrame.phase).toBe('testing');
    expect(midFrame.fitRatePercent).toBe(0);

    const emptyInv = new TumblerInventory(2, 4, [new TumblerSchematic('L1', 'lock', 4, [0, 1])], []);
    const emptyFrame = new TumblerTraceFrame(emptyInv, null, 0);
    expect(emptyFrame.pairIndex).toBeNull();
    expect(emptyFrame.testedCount).toBe(0);
    expect(emptyFrame.totalPairs).toBe(0);
    expect(emptyFrame.isComplete).toBe(true);
    expect(emptyFrame.phase).toBe('complete');
    expect(emptyFrame.fitRatePercent).toBe(0);
  });

  it('rejects inconsistent evaluation or out-of-range matchCount', () => {
    const inv = parseSchematics(EXAMPLE);
    const foreignLock = new TumblerSchematic('L9', 'lock', 7, [0, 0, 0, 0, 0]);
    const foreignKey = new TumblerSchematic('K9', 'key', 7, [0, 0, 0, 0, 0]);
    const validEval = new PairFitEvaluation(inv.locks[0]!, inv.keys[0]!, 0, 0);

    expect(() => new TumblerTraceFrame(inv, null, 0)).toThrow('zero pairs');
    expect(() => new TumblerTraceFrame(inv, new PairFitEvaluation(foreignLock, inv.keys[0]!, 0, 0), 0)).toThrow(
      'does not belong',
    );
    expect(() => new TumblerTraceFrame(inv, new PairFitEvaluation(inv.locks[0]!, foreignKey, 0, 0), 0)).toThrow(
      'does not belong',
    );
    expect(() => new TumblerTraceFrame(inv, validEval, -1)).toThrow(RangeError);
    expect(() => new TumblerTraceFrame(inv, validEval, 2)).toThrow(RangeError);
    expect(() => new TumblerTraceFrame(inv, validEval, 0.5)).toThrow(RangeError);
  });
});

describe('buildMatchTrace', () => {
  it('builds full traces, samples down to maxSteps preserving final frame, and handles zero pairs', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const inv = parseSchematics(EXAMPLE);
    const full = buildMatchTrace(inv);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full).toHaveLength(6);
    expect(full[0]!.testedCount).toBe(1);
    expect(full[0]!.phase).toBe('testing');
    expect(full[5]!.testedCount).toBe(6);
    expect(full[5]!.matchCount).toBe(3);
    expect(full[5]!.phase).toBe('complete');
    expect(full[5]!.fitRatePercent).toBe(50);

    const sampled = buildMatchTrace(inv, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]!.pairIndex).toBe(0);
    expect(sampled[2]!.pairIndex).toBe(5);
    expect(sampled[2]!.matchCount).toBe(3);
    expect(sampled[2]!.isComplete).toBe(true);

    const single = buildMatchTrace(inv, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.pairIndex).toBe(5);
    expect(single[0]!.matchCount).toBe(3);

    const noKeys = new TumblerInventory(5, 7, [inv.locks[0]!], []);
    const emptyTrace = buildMatchTrace(noKeys);
    expect(emptyTrace).toHaveLength(1);
    expect(emptyTrace[0]!.evaluation).toBeNull();
    expect(emptyTrace[0]!.isComplete).toBe(true);

    expect(() => buildMatchTrace(inv, { maxSteps: 0 })).toThrow(RangeError);
  });
});
