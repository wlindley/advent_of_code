import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS } from './bitmapFont';
import { ALL_FOLDS_CODE_POLICY, FIRST_FOLD_COUNT_POLICY } from './policy';
import { OrigamiSolver } from './solver';

const EXAMPLE = [
  '6,10', '0,14', '9,10', '0,3', '10,4', '4,11', '6,0', '6,12', '4,1',
  '0,13', '10,12', '3,4', '3,0', '8,4', '1,10', '2,14', '8,10', '9,0',
  '',
  'fold along y=7',
  'fold along x=5',
].join('\n');

function buildCodeInput(letter: string): string {
  const rows = CANONICAL_GLYPHS.find((g) => g.letter === letter)!.rows;
  const dots: string[] = [];
  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < rows[y]!.length; x += 1) {
      if (rows[y]![x] === '#') dots.push(`${x},${y}`);
    }
  }
  return [...dots, '', 'fold along x=5'].join('\n');
}

describe('OrigamiSolver', () => {
  it('solves and traces Part 1 with FIRST_FOLD_COUNT_POLICY', () => {
    const solver = new OrigamiSolver(FIRST_FOLD_COUNT_POLICY);
    const manual = solver.parse(EXAMPLE);
    expect(solver.solve(manual)).toBe(17);
    expect(solver.trace(manual)).toHaveLength(2);
    expect(solver.trace(manual, { maxSteps: 1 })).toHaveLength(1);
  });

  it('solves and traces Part 2 with ALL_FOLDS_CODE_POLICY', () => {
    const solver = new OrigamiSolver(ALL_FOLDS_CODE_POLICY);
    const manual = solver.parse(buildCodeInput('E'));
    expect(solver.solve(manual)).toBe('E');
    expect(solver.trace(manual)).toHaveLength(2);
  });
});
