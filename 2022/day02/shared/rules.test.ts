import { describe, expect, it } from 'vitest';
import {
  evaluateOutcome,
  isShape,
  Outcome,
  OUTCOME_LABELS,
  Shape,
  SHAPE_LABELS,
} from './rules';

describe('2022 day 02 rules', () => {
  it('exports frozen Shape, Outcome, and label tables', () => {
    expect(Object.isFrozen(Shape)).toBe(true);
    expect(Object.isFrozen(Outcome)).toBe(true);
    expect(Object.isFrozen(SHAPE_LABELS)).toBe(true);
    expect(Object.isFrozen(OUTCOME_LABELS)).toBe(true);
    expect(SHAPE_LABELS[Shape.Rock]).toBe('Rock');
    expect(SHAPE_LABELS[Shape.Paper]).toBe('Paper');
    expect(SHAPE_LABELS[Shape.Scissors]).toBe('Scissors');
    expect(OUTCOME_LABELS[Outcome.Loss]).toBe('Loss');
    expect(OUTCOME_LABELS[Outcome.Draw]).toBe('Draw');
    expect(OUTCOME_LABELS[Outcome.Win]).toBe('Win');
  });

  it('validates Shape values with isShape', () => {
    expect(isShape(Shape.Rock)).toBe(true);
    expect(isShape(Shape.Paper)).toBe(true);
    expect(isShape(Shape.Scissors)).toBe(true);
    expect(isShape(-1)).toBe(false);
    expect(isShape(3)).toBe(false);
    expect(isShape(1.5)).toBe(false);
    expect(isShape(Number.NaN)).toBe(false);
  });

  it('evaluates all 9 Rock-Paper-Scissors matchups', () => {
    expect(evaluateOutcome(Shape.Rock, Shape.Rock)).toBe(Outcome.Draw);
    expect(evaluateOutcome(Shape.Rock, Shape.Paper)).toBe(Outcome.Win);
    expect(evaluateOutcome(Shape.Rock, Shape.Scissors)).toBe(Outcome.Loss);

    expect(evaluateOutcome(Shape.Paper, Shape.Rock)).toBe(Outcome.Loss);
    expect(evaluateOutcome(Shape.Paper, Shape.Paper)).toBe(Outcome.Draw);
    expect(evaluateOutcome(Shape.Paper, Shape.Scissors)).toBe(Outcome.Win);

    expect(evaluateOutcome(Shape.Scissors, Shape.Rock)).toBe(Outcome.Win);
    expect(evaluateOutcome(Shape.Scissors, Shape.Paper)).toBe(Outcome.Loss);
    expect(evaluateOutcome(Shape.Scissors, Shape.Scissors)).toBe(Outcome.Draw);
  });

  it('rejects invalid opponent or player shapes with RangeError', () => {
    expect(() => evaluateOutcome(-1 as Shape, Shape.Rock)).toThrow(RangeError);
    expect(() => evaluateOutcome(Shape.Rock, 3 as Shape)).toThrow(RangeError);
  });
});
