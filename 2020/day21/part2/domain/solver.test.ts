import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'mxmxvkd kfcds sqjhc nhms (contains dairy, fish)',
  'trh fvjkl sbzzf mxmxvkd (contains dairy)',
  'sqjhc fvjkl (contains soy)',
  'sqjhc mxmxvkd sbzzf (contains fish)',
].join('\n');

function buildLargeVocabInput(): string {
  const safeWords: string[] = [];
  for (let i = 0; i < 66; i += 1) {
    const first = String.fromCharCode(97 + Math.floor(i / 26));
    const second = String.fromCharCode(97 + (i % 26));
    safeWords.push(`ing${first}${second}`);
  }
  const line1 = `${safeWords.join(' ')} zzzdanger aaadanger (contains beta, alpha)`;
  const line2 = 'zzzdanger aaadanger (contains alpha)';
  const line3 = 'aaadanger other (contains beta)';
  return [line1, line2, line3].join('\n');
}

describe('2020 Day 21 Part 2 solver', () => {
  it('solves the official 4-food example with the dangerous-list policy', () => {
    expect(solver.policy.id).toBe('dangerous-list');
    const result = executeSolver(solver, EXAMPLE_INPUT);
    expect(result.answer).toBe('mxmxvkd,sqjhc,fvjkl');
  });

  it('handles multi-lock parallel peeling and sorts output strictly by allergen ASCII order', () => {
    const input = [
      'zesty alphaone midone extra (contains zebra, alpha, mid)',
      'alphaone safe (contains alpha)',
      'midone safe (contains mid)',
      'zesty alphaone (contains zebra)',
    ].join('\n');
    const result = executeSolver(solver, input);
    expect(result.answer).toBe('alphaone,midone,zesty');

    const frames = solver.trace(solver.parse(input));
    expect(frames.length).toBe(3);
    expect(frames[1]!.activeLocks.map((entry) => entry.allergen)).toEqual(['alpha', 'mid']);
    expect(frames[2]!.activeLocks.map((entry) => entry.allergen)).toEqual(['zebra']);
  });

  it('handles boundary cases: zero-allergen document, single-allergen minimal input, and >64 ingredients', () => {
    const zeroDoc = solver.parse('alpha beta\ngamma');
    expect(solver.solve(zeroDoc)).toBe('');
    const zeroFrames = solver.trace(zeroDoc);
    expect(zeroFrames.length).toBe(1);
    expect(zeroFrames[0]!.roundNumber).toBe(0);
    expect(zeroFrames[0]!.totalRounds).toBe(0);
    expect(zeroFrames[0]!.isFinal).toBe(true);
    expect(zeroFrames[0]!.lockedCount).toBe(0);
    expect(zeroFrames[0]!.canonicalDangerousSoFar).toBe('');

    const single = executeSolver(solver, 'onlyone safe (contains gluten)\nonlyone (contains gluten)');
    expect(single.answer).toBe('onlyone');

    const largeDoc = solver.parse(buildLargeVocabInput());
    expect(largeDoc.ingredientCount).toBe(69);
    expect(solver.solve(largeDoc)).toBe('zzzdanger,aaadanger');
  });

  it('emits valid peeling trace invariants and honors maxSteps caps and validation', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace(parsed);
    expect(full.length).toBe(4);
    expect(full.map((frame) => frame.roundNumber)).toEqual([0, 1, 2, 3]);

    const f0 = full[0]!;
    expect(f0.kind).toBe('peeling');
    expect(f0.priorAssignments).toEqual([]);
    expect(f0.activeLocks).toEqual([]);
    expect(f0.lockedCount).toBe(0);
    expect(f0.canonicalDangerousSoFar).toBe('');
    expect(f0.safeAppearances).toBe(5);
    expect(f0.isFinal).toBe(false);

    const f1 = full[1]!;
    expect(f1.priorAssignments).toEqual([]);
    expect(f1.activeLocks.map((entry) => `${entry.allergen}:${entry.ingredient}`)).toEqual(['dairy:mxmxvkd']);
    expect(f1.lockedCount).toBe(1);
    expect(f1.canonicalDangerousSoFar).toBe('mxmxvkd');
    expect(f1.isFinal).toBe(false);

    const f3 = full[3]!;
    expect(f3.priorAssignments.map((entry) => entry.allergen)).toEqual(['dairy', 'fish']);
    expect(f3.activeLocks.map((entry) => `${entry.allergen}:${entry.ingredient}`)).toEqual(['soy:fvjkl']);
    expect(f3.lockedCount).toBe(3);
    expect(f3.canonicalDangerousSoFar).toBe('mxmxvkd,sqjhc,fvjkl');
    expect(f3.safeAppearances).toBe(5);
    expect(f3.isFinal).toBe(true);

    expect(solver.trace(parsed, { maxSteps: 2 }).map((frame) => frame.roundNumber)).toEqual([0, 3]);
    expect(solver.trace(parsed, { maxSteps: 1 }).map((frame) => frame.roundNumber)).toEqual([3]);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(parsed, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('rejects empty input with exact error message', () => {
    expect(() => solver.parse('')).toThrow('Allergen document is empty');
  });

  it('rejects malformed contains keyword syntax', () => {
    expect(() => solver.parse('alpha (has dairy)')).toThrow(/malformed contains keyword/);
  });

  it('rejects empty allergen candidate intersection', () => {
    const doc = solver.parse('alpha (contains dairy)\nbeta (contains dairy)');
    expect(() => solver.solve(doc)).toThrow('Allergen "dairy" has no candidate ingredients');
  });

  it('rejects same-round ingredient collision during peeling', () => {
    const doc = solver.parse('x (contains a)\nx (contains b)');
    expect(() => solver.solve(doc)).toThrow('Ingredient collision during peeling round 1');
  });

  it('rejects post-lock candidate exhaustion during peeling', () => {
    const doc = solver.parse('x (contains a)\ny (contains b)\nx y (contains c)');
    expect(() => solver.solve(doc)).toThrow('Allergen "c" has no remaining candidate ingredients');
  });

  it('rejects ambiguous stall when no singleton candidates remain', () => {
    const doc = solver.parse('x y (contains a, b)');
    expect(() => solver.solve(doc)).toThrow('Ambiguous allergen mapping: no singleton candidates remain');
  });
});
