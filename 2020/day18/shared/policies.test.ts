import { describe, expect, it } from 'vitest';
import {
  ADD_BEFORE_MUL_POLICY,
  applyBinaryOperator,
  DEFAULT_MAX_TRACE_STEPS,
  EQUAL_PRECEDENCE_POLICY,
} from './policies';

describe('day18 precedence policies', () => {
  it('defines frozen Part 1 equal precedence and Part 2 add-before-mul policies', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(EQUAL_PRECEDENCE_POLICY)).toBe(true);
    expect(Object.isFrozen(EQUAL_PRECEDENCE_POLICY.precedence)).toBe(true);
    expect(EQUAL_PRECEDENCE_POLICY.id).toBe('equal');
    expect(EQUAL_PRECEDENCE_POLICY.precedence['+']).toBe(EQUAL_PRECEDENCE_POLICY.precedence['*']);

    expect(Object.isFrozen(ADD_BEFORE_MUL_POLICY)).toBe(true);
    expect(Object.isFrozen(ADD_BEFORE_MUL_POLICY.precedence)).toBe(true);
    expect(ADD_BEFORE_MUL_POLICY.id).toBe('add-before-mul');
    expect(ADD_BEFORE_MUL_POLICY.precedence['+']).toBeGreaterThan(ADD_BEFORE_MUL_POLICY.precedence['*']);
  });

  it('applies + and * with exact BigInt arithmetic', () => {
    expect(applyBinaryOperator('+', 2n, 3n)).toBe(5n);
    expect(applyBinaryOperator('*', 6n, 7n)).toBe(42n);
    const large = 1n << 80n;
    expect(applyBinaryOperator('+', large, 1n)).toBe((1n << 80n) + 1n);
    expect(applyBinaryOperator('*', large, 3n)).toBe(large * 3n);
  });
});
