import { describe, expect, it } from 'vitest';
import { parseAllergenDocument } from './model';
import { DANGEROUS_LIST_POLICY, SAFE_APPEARANCES_POLICY } from './policies';
import { AllergenAssessmentSolver } from './solver';
import { IntersectionTraceFrame, PeelingTraceFrame } from './traceFrames';

const EXAMPLE = [
  'mxmxvkd kfcds sqjhc nhms (contains dairy, fish)',
  'trh fvjkl sbzzf mxmxvkd (contains dairy)',
  'sqjhc fvjkl (contains soy)',
  'sqjhc mxmxvkd sbzzf (contains fish)',
].join('\n');

describe('2020 Day 21 policies & solver', () => {
  it('SAFE_APPEARANCES_POLICY solves official example, multi-matching cases, and zero-allergen docs', () => {
    const exampleDoc = parseAllergenDocument(EXAMPLE);
    expect(SAFE_APPEARANCES_POLICY.id).toBe('safe-appearances');
    expect(SAFE_APPEARANCES_POLICY.solve(exampleDoc)).toBe(5);

    // Ambiguous matching: a-> {x,y}, b-> {x,y}; z is safe and appears once.
    const multiDoc = parseAllergenDocument('x y z (contains a, b)\nx y (contains a)\nx y (contains b)');
    expect(SAFE_APPEARANCES_POLICY.solve(multiDoc)).toBe(1);

    const noAlgDoc = parseAllergenDocument('x y\nz');
    expect(SAFE_APPEARANCES_POLICY.solve(noAlgDoc)).toBe(3);
  });

  it('SAFE_APPEARANCES_POLICY emits intersection trace frames and honors maxSteps', () => {
    const doc = parseAllergenDocument(EXAMPLE);
    const full = SAFE_APPEARANCES_POLICY.trace(doc, 80);
    expect(full.length).toBe(4);
    expect(full[0]).toBeInstanceOf(IntersectionTraceFrame);
    expect(full[0]!.scannedCount).toBe(1);
    expect(full[0]!.totalFoods).toBe(4);
    expect(full[0]!.isFinal).toBe(false);
    expect(full[0]!.currentFood.index).toBe(0);

    const last = full[3]!;
    expect(last.isFinal).toBe(true);
    expect(last.safeCount).toBe(4);
    expect(last.suspectCount).toBe(3);
    expect(last.runningSafeAppearances).toBe(5);

    const sampled = SAFE_APPEARANCES_POLICY.trace(doc, 2);
    expect(sampled.map((f) => f.foodIndex)).toEqual([0, 3]);

    const emptyInt = parseAllergenDocument('x (contains a)\ny (contains a)');
    expect(() => SAFE_APPEARANCES_POLICY.trace(emptyInt, 10)).toThrow();
  });

  it('DANGEROUS_LIST_POLICY solves and traces peeling rounds cleanly', () => {
    const doc = parseAllergenDocument(EXAMPLE);
    expect(DANGEROUS_LIST_POLICY.id).toBe('dangerous-list');
    expect(DANGEROUS_LIST_POLICY.solve(doc)).toBe('mxmxvkd,sqjhc,fvjkl');

    const frames = DANGEROUS_LIST_POLICY.trace(doc, 80);
    expect(frames.length).toBe(4);
    expect(frames[0]).toBeInstanceOf(PeelingTraceFrame);
    expect(frames[0]!.roundNumber).toBe(0);
    expect(frames[0]!.lockedCount).toBe(0);
    expect(frames[0]!.isFinal).toBe(false);

    const last = frames[3]!;
    expect(last.isFinal).toBe(true);
    expect(last.lockedCount).toBe(3);
    expect(last.canonicalDangerousSoFar).toBe('mxmxvkd,sqjhc,fvjkl');
    expect(last.safeAppearances).toBe(5);

    const sampled = DANGEROUS_LIST_POLICY.trace(doc, 2);
    expect(sampled.map((f) => f.roundNumber)).toEqual([0, 3]);

    const noAlgDoc = parseAllergenDocument('alpha beta');
    expect(DANGEROUS_LIST_POLICY.solve(noAlgDoc)).toBe('');
    const noAlgFrames = DANGEROUS_LIST_POLICY.trace(noAlgDoc, 10);
    expect(noAlgFrames.length).toBe(1);
    expect(noAlgFrames[0]!.isFinal).toBe(true);
    expect(noAlgFrames[0]!.canonicalDangerousSoFar).toBe('');
  });

  it('AllergenAssessmentSolver delegates parse/solve/trace and validates maxSteps', () => {
    const solver = new AllergenAssessmentSolver(SAFE_APPEARANCES_POLICY);
    const parsed = solver.parse(EXAMPLE);
    expect(solver.solve(parsed)).toBe(5);
    expect(solver.trace(parsed).length).toBe(4);
    expect(solver.trace(parsed, { maxSteps: 2 }).length).toBe(2);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(parsed, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
