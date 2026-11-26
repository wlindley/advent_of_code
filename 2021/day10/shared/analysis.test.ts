import { describe, expect, it } from 'vitest';
import { analyzeSyntax, compareBigIntAsc, SyntaxAnalysis } from './analysis';

const OFFICIAL_EXAMPLE = [
  '[({(<(())[]>[[{[]{<()<>>',
  '[(()[<>])]({[<{<<[]>>(',
  '{([(<{}[<>[]}>{[]{[(<()>',
  '(((({<>}<{<{<>}{[]{[]{}',
  '[[<[([]))<([[{}[[()]]]',
  '[{[{({}]{}}([{[{{{}}([]',
  '{<[[]]>}<{[{[{[]{()[[[]',
  '[<(<(<(<{}))><([]([]()',
  '<{([([[(<>()){}]>(<<{{',
  '<{([{{}}[<[[[<>{}]]]>[]]',
];

describe('compareBigIntAsc', () => {
  it('performs 3-way BigInt comparison for less, greater, and equal values', () => {
    expect(compareBigIntAsc(1n, 2n)).toBe(-1);
    expect(compareBigIntAsc(5n, 2n)).toBe(1);
    expect(compareBigIntAsc(42n, 42n)).toBe(0);
  });
});

describe('SyntaxAnalysis', () => {
  it('rejects empty results array', () => {
    expect(() => new SyntaxAnalysis([])).toThrow(RangeError);
    expect(() => analyzeSyntax([])).toThrow(RangeError);
  });

  it('computes corrupted, incomplete, and complete line partitions and official scores', () => {
    const analysis = analyzeSyntax(OFFICIAL_EXAMPLE);
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(analysis.results).toHaveLength(10);
    expect(analysis.corruptedLines).toHaveLength(5);
    expect(analysis.incompleteLines).toHaveLength(5);
    expect(analysis.completeLines).toHaveLength(0);
    expect(analysis.totalCorruptionScore).toBe(26397n);
    expect(analysis.medianAutocompleteScore).toBe(288957n);
    expect(analysis.medianIncompleteLine.autocompleteScore).toBe(288957n);
  });

  it('tracks complete lines and duplicate incomplete scores and rejects missing incomplete median', () => {
    const withDupes = analyzeSyntax(['([])', '(', '(', '[']);
    expect(withDupes.completeLines).toHaveLength(1);
    expect(withDupes.sortedIncompleteLines.map((l) => l.autocompleteScore)).toEqual([1n, 1n, 2n]);
    expect(withDupes.medianAutocompleteScore).toBe(1n);

    const noIncomplete = analyzeSyntax(['([])', '(]']);
    expect(noIncomplete.incompleteLines).toHaveLength(0);
    expect(() => noIncomplete.medianIncompleteLine).toThrow(RangeError);
    expect(() => noIncomplete.medianAutocompleteScore).toThrow(RangeError);
  });
});
