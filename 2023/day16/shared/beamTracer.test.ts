import { describe, expect, it } from 'vitest';
import { BeamTracer, DEFAULT_MAX_TRACE_STEPS } from './beamTracer';
import { Contraption } from './contraption';
import { createBeamState, DIR_E, DIR_N, DIR_S } from './optics';

const OFFICIAL_EXAMPLE_LINES = [
  '.|...\\....',
  '|.-.\\.....',
  '.....|-...',
  '........|.',
  '..........',
  '.........\\',
  '..../.\\\\..',
  '.-.-/..|..',
  '.|....-|.\\',
  '..//.|....',
] as const;

describe('BeamTracer unit tests', () => {
  it('verifies the official 10x10 fixture row widths and solves Part 1 as 46', () => {
    for (const row of OFFICIAL_EXAMPLE_LINES) {
      expect(row).toHaveLength(10);
    }
    const contraption = Contraption.fromLines(OFFICIAL_EXAMPLE_LINES);
    const tracer = new BeamTracer(contraption);
    expect(tracer.countEnergized(createBeamState(0, 0, DIR_E))).toBe(46);
    expect(tracer.countEnergized(createBeamState(0, 3, DIR_S))).toBe(51);
  });

  it('energizes (0, 0) immediately at Wave 0 and reflects/splits on entry tile', () => {
    const backslashGrid = Contraption.fromLines(['\\.', '..']);
    const tracer = new BeamTracer(backslashGrid);
    const frames = tracer.traceWaves(createBeamState(0, 0, DIR_E));

    expect(frames).toHaveLength(2);
    expect(frames[0]!.wave).toBe(0);
    expect(frames[0]!.totalWaves).toBe(2);
    expect(frames[0]!.energizedCount).toBe(1);
    expect(frames[0]!.isEnergized(0, 0)).toBe(true);
    expect(frames[0]!.frontier).toEqual([createBeamState(0, 0, DIR_E)]);
    expect(frames[1]!.wave).toBe(1);
    expect(frames[1]!.energizedCount).toBe(2);
    expect(frames[1]!.frontier).toEqual([createBeamState(1, 0, DIR_S)]);

    // Reusing the same BeamTracer instance across multiple entries leaves no stale state.
    expect(tracer.countEnergized(createBeamState(0, 0, DIR_S))).toBe(2);
    expect(tracer.countEnergized(createBeamState(1, 1, DIR_N))).toBe(2);
  });

  it('samples trace waves cleanly when totalWaves exceeds maxSteps and preserves endpoints', () => {
    const contraption = Contraption.fromLines(OFFICIAL_EXAMPLE_LINES);
    const tracer = new BeamTracer(contraption);
    const fullFrames = tracer.traceWaves(createBeamState(0, 0, DIR_E));
    expect(fullFrames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);

    const capped = tracer.traceWaves(createBeamState(0, 0, DIR_E), { maxSteps: 4 });
    expect(capped).toHaveLength(4);
    expect(capped[0]!.wave).toBe(0);
    expect(capped[3]!.wave).toBe(fullFrames.length - 1);
    expect(capped[3]!.energizedCount).toBe(46);
    expect(Object.isFrozen(capped)).toBe(true);
  });

  it('handles loops and splitters without infinite traversal', () => {
    const loopGrid = Contraption.fromLines(['/\\', '\\/']);
    const tracer = new BeamTracer(loopGrid);
    expect(tracer.countEnergized(createBeamState(0, 0, DIR_N))).toBe(4);
    expect(tracer.countEnergized(createBeamState(0, 0, DIR_S))).toBe(1);
    expect(tracer.countEnergized(createBeamState(1, 1, DIR_S))).toBe(4);

    const splitterLoop = Contraption.fromLines(['.-\\', '.|.', '.\\/']);
    const splitTracer = new BeamTracer(splitterLoop);
    expect(splitTracer.countEnergized(createBeamState(1, 0, DIR_E))).toBe(8);
  });

  it('rejects out-of-bounds entry states and invalid maxSteps options', () => {
    const tracer = new BeamTracer(Contraption.fromLines(['..', '..']));
    expect(() => tracer.countEnergized(createBeamState(2, 0, DIR_E))).toThrow(RangeError);
    expect(() => tracer.traceWaves(createBeamState(0, 2, DIR_E))).toThrow(RangeError);
    expect(() => tracer.traceWaves(createBeamState(0, 0, DIR_E), { maxSteps: 0 })).toThrow(RangeError);
    expect(() => tracer.traceWaves(createBeamState(0, 0, DIR_E), { maxSteps: -2 })).toThrow(RangeError);
  });
});
