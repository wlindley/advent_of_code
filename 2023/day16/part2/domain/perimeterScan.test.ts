import { describe, expect, it } from 'vitest';
import {
  type BeamDirection,
  createBeamState,
  DIR_E,
  DIR_N,
  DIR_S,
  DIR_W,
  parseContraption,
} from '../../shared';
import { PerimeterScanResult, scanPerimeter, traceOptimalPerimeter } from './perimeterScan';

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

describe('PerimeterScanResult', () => {
  it('rejects empty score lists', () => {
    expect(() => new PerimeterScanResult([])).toThrow(RangeError);
  });

  it('rejects zero energizedCount', () => {
    expect(() => new PerimeterScanResult([{ entry: createBeamState(0, 0, DIR_E), energizedCount: 0 }])).toThrow(RangeError);
  });

  it('rejects negative energizedCount', () => {
    expect(() => new PerimeterScanResult([{ entry: createBeamState(0, 0, DIR_E), energizedCount: -2 }])).toThrow(RangeError);
  });

  it('rejects fractional energizedCount', () => {
    expect(() => new PerimeterScanResult([{ entry: createBeamState(0, 0, DIR_E), energizedCount: 1.5 }])).toThrow(RangeError);
  });

  it('rejects NaN energizedCount', () => {
    expect(() => new PerimeterScanResult([{ entry: createBeamState(0, 0, DIR_E), energizedCount: Number.NaN }])).toThrow(RangeError);
  });

  it('returns the sole entry for single-item results and defensively freezes', () => {
    const mutableEntry: { row: number; col: number; dir: BeamDirection } = { row: 0, col: 0, dir: DIR_S };
    const mutableScore = { entry: mutableEntry, energizedCount: 7 };
    const input = [mutableScore];
    const result = new PerimeterScanResult(input);
    input.push({ entry: createBeamState(0, 1, DIR_S), energizedCount: 99 });
    mutableScore.energizedCount = 1;
    mutableEntry.row = 5;
    expect(result.scores).toHaveLength(1);
    expect(result.best).toEqual({ entry: { row: 0, col: 0, dir: DIR_S }, energizedCount: 7 });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.scores)).toBe(true);
    expect(Object.isFrozen(result.scores[0])).toBe(true);
    expect(Object.isFrozen(result.scores[0]!.entry)).toBe(true);
  });

  it('breaks ties strictly using first-in-scan-order', () => {
    const first = createBeamState(0, 1, DIR_S);
    const second = createBeamState(0, 2, DIR_S);
    const result = new PerimeterScanResult([
      { entry: createBeamState(0, 0, DIR_S), energizedCount: 3 },
      { entry: first, energizedCount: 8 },
      { entry: second, energizedCount: 8 },
    ]);
    expect(result.best.entry).toEqual(first);
    expect(result.best.energizedCount).toBe(8);
  });
});

describe('scanPerimeter', () => {
  it('solves the official 10x10 example with 40 perimeter scores and max 51 at (0, 3) S', () => {
    expect(OFFICIAL_EXAMPLE_LINES.every((row) => row.length === 10)).toBe(true);
    const scan = scanPerimeter(parseContraption(OFFICIAL_EXAMPLE_LINES.join('\n')));
    expect(scan.scores).toHaveLength(40);
    expect(scan.best.entry).toEqual(createBeamState(0, 3, DIR_S));
    expect(scan.best.energizedCount).toBe(51);
    const topLeftEast = scan.scores.find((s) => s.entry.row === 0 && s.entry.col === 0 && s.entry.dir === DIR_E);
    expect(topLeftEast?.energizedCount).toBe(46);
  });

  it('handles 1x1 and non-square 1x4 and 4x1 grids', () => {
    const oneByOne = scanPerimeter(parseContraption('.'));
    expect(oneByOne.scores).toHaveLength(4);
    expect(oneByOne.best).toEqual({ entry: createBeamState(0, 0, DIR_S), energizedCount: 1 });
    expect(scanPerimeter(parseContraption('.--.')).best.energizedCount).toBe(4);
    expect(scanPerimeter(parseContraption('.\n|\n|\n.')).best.energizedCount).toBe(4);
  });

  it('finds optimal entries from bottom, left, and right edges and distinguishes corner directions', () => {
    const bottomBest = scanPerimeter(parseContraption('.-.\n...\n...'));
    expect(bottomBest.best).toEqual({ entry: createBeamState(2, 1, DIR_N), energizedCount: 5 });

    const leftBest = scanPerimeter(parseContraption('...\n..|\n...'));
    expect(leftBest.best).toEqual({ entry: createBeamState(1, 0, DIR_E), energizedCount: 5 });

    const rightBest = scanPerimeter(parseContraption('...\n|..\n...'));
    expect(rightBest.best).toEqual({ entry: createBeamState(1, 2, DIR_W), energizedCount: 5 });

    const corner = scanPerimeter(parseContraption('\\.|\n...'));
    const cornerS = corner.scores.find((s) => s.entry.row === 0 && s.entry.col === 0 && s.entry.dir === DIR_S);
    const cornerE = corner.scores.find((s) => s.entry.row === 0 && s.entry.col === 0 && s.entry.dir === DIR_E);
    expect(cornerS?.energizedCount).toBe(4);
    expect(cornerE?.energizedCount).toBe(2);
  });
});

describe('traceOptimalPerimeter', () => {
  it('returns frozen scan and frames starting at optimal entry and ending at max energized count', () => {
    const contraption = parseContraption(OFFICIAL_EXAMPLE_LINES.join('\n'));
    const trace = traceOptimalPerimeter(contraption);
    expect(Object.isFrozen(trace)).toBe(true);
    expect(trace.scan.best.entry).toEqual(createBeamState(0, 3, DIR_S));
    expect(trace.frames[0]!.entry).toEqual(trace.scan.best.entry);
    expect(trace.frames[0]!.energizedCount).toBe(1);
    expect(trace.frames[trace.frames.length - 1]!.energizedCount).toBe(51);
  });

  it('respects maxSteps sampling and rejects non-positive maxSteps', () => {
    const contraption = parseContraption(OFFICIAL_EXAMPLE_LINES.join('\n'));
    const sampled = traceOptimalPerimeter(contraption, { maxSteps: 6 });
    expect(sampled.frames).toHaveLength(6);
    expect(sampled.frames[sampled.frames.length - 1]!.energizedCount).toBe(51);
    expect(() => traceOptimalPerimeter(contraption, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceOptimalPerimeter(contraption, { maxSteps: -1 })).toThrow(RangeError);
  });
});
