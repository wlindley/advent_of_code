import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS } from './bitmapFont';
import { DotSheet, FoldInstruction, OrigamiManual, type Dot } from './models';
import { ALL_FOLDS_CODE_POLICY, FIRST_FOLD_COUNT_POLICY } from './policy';

function makeGlyphSheet(letter: string): DotSheet {
  const rows = CANONICAL_GLYPHS.find((g) => g.letter === letter)!.rows;
  const dots: Dot[] = [];
  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < rows[y]!.length; x += 1) {
      if (rows[y]![x] === '#') dots.push({ x, y });
    }
  }
  return new DotSheet(dots);
}

describe('policy', () => {
  it('FIRST_FOLD_COUNT_POLICY folds once and counts visible dots', () => {
    const sheet = new DotSheet([
      { x: 0, y: 0 },
      { x: 2, y: 1 },
    ]);
    const manual = new OrigamiManual(sheet, [
      new FoldInstruction('x', 1),
      new FoldInstruction('y', 1),
    ]);

    expect(FIRST_FOLD_COUNT_POLICY.name).toBe('First Fold');
    expect(FIRST_FOLD_COUNT_POLICY.answerLabel).toBe('Visible Dots');
    expect(FIRST_FOLD_COUNT_POLICY.foldCount(manual)).toBe(1);
    expect(FIRST_FOLD_COUNT_POLICY.extractAnswer(sheet)).toBe(2);
  });

  it('ALL_FOLDS_CODE_POLICY applies all folds and decodes the 5x6 bitmap code', () => {
    const sheet = makeGlyphSheet('A');
    const manual = new OrigamiManual(sheet, [
      new FoldInstruction('x', 5),
      new FoldInstruction('y', 6),
      new FoldInstruction('x', 5),
    ]);

    expect(ALL_FOLDS_CODE_POLICY.name).toBe('All Folds');
    expect(ALL_FOLDS_CODE_POLICY.answerLabel).toBe('Activation Code');
    expect(ALL_FOLDS_CODE_POLICY.foldCount(manual)).toBe(3);
    expect(ALL_FOLDS_CODE_POLICY.extractAnswer(sheet)).toBe('A');
  });
});
