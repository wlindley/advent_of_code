import { describe, expect, it } from 'vitest';
import { PasswordEntry } from './passwordEntry';
import { SLED_RENTAL_POLICY, TOBOGGAN_POLICY } from './policy';

describe('SLED_RENTAL_POLICY', () => {
  it('exposes frozen policy metadata', () => {
    expect(SLED_RENTAL_POLICY.id).toBe('sled-rental');
    expect(SLED_RENTAL_POLICY.name).toBe('Sled Rental Policy');
    expect(SLED_RENTAL_POLICY.ruleSummary.length).toBeGreaterThan(0);
    expect(Object.isFrozen(SLED_RENTAL_POLICY)).toBe(true);
  });

  it('validates entry when letter count is within [first, second] inclusive', () => {
    const entry = new PasswordEntry(1, 3, 'a', 'abcde');
    const evaluation = SLED_RENTAL_POLICY.evaluate(entry);

    expect(Object.isFrozen(evaluation)).toBe(true);
    expect(evaluation.entry).toBe(entry);
    expect(evaluation.policy).toBe(SLED_RENTAL_POLICY);
    expect(evaluation.isValid).toBe(true);
    expect(evaluation.checkedIndices).toEqual([0, 1, 2, 3, 4]);
    expect(evaluation.matchedIndices).toEqual([0]);
    expect(evaluation.detail).toContain('1');
    expect(evaluation.charStatusAt(0)).toBe('match');
    expect(evaluation.charStatusAt(1)).toBe('neutral');
    expect(evaluation.charStatusAt(99)).toBe('neutral');
  });

  it('scans the full password without early exit when count exceeds second bound', () => {
    const entry = new PasswordEntry(1, 2, 'c', 'ccccc');
    const evaluation = SLED_RENTAL_POLICY.evaluate(entry);

    expect(evaluation.isValid).toBe(false);
    expect(evaluation.matchedIndices).toEqual([0, 1, 2, 3, 4]);
    expect(evaluation.detail).toContain('5');
  });

  it('rejects entry when count is below first bound', () => {
    const entry = new PasswordEntry(1, 3, 'b', 'cdefg');
    const evaluation = SLED_RENTAL_POLICY.evaluate(entry);

    expect(evaluation.isValid).toBe(false);
    expect(evaluation.matchedIndices).toEqual([]);
  });

  it('accepts exact upper bound count (2-9 c: ccccccccc)', () => {
    const entry = new PasswordEntry(2, 9, 'c', 'ccccccccc');
    const evaluation = SLED_RENTAL_POLICY.evaluate(entry);

    expect(evaluation.isValid).toBe(true);
    expect(evaluation.matchedIndices).toHaveLength(9);
  });
});

describe('TOBOGGAN_POLICY', () => {
  it('exposes frozen policy metadata', () => {
    expect(TOBOGGAN_POLICY.id).toBe('toboggan');
    expect(TOBOGGAN_POLICY.name).toBe('Toboggan Corporate Policy');
    expect(TOBOGGAN_POLICY.ruleSummary.length).toBeGreaterThan(0);
    expect(Object.isFrozen(TOBOGGAN_POLICY)).toBe(true);
  });

  it('accepts when only first 1-based position matches', () => {
    const entry = new PasswordEntry(1, 3, 'a', 'abcde');
    const evaluation = TOBOGGAN_POLICY.evaluate(entry);

    expect(Object.isFrozen(evaluation)).toBe(true);
    expect(evaluation.entry).toBe(entry);
    expect(evaluation.policy).toBe(TOBOGGAN_POLICY);
    expect(evaluation.isValid).toBe(true);
    expect(evaluation.checkedIndices).toEqual([0, 2]);
    expect(evaluation.matchedIndices).toEqual([0]);
    expect(evaluation.detail).toContain('1/1');
    expect(evaluation.charStatusAt(0)).toBe('match');
    expect(evaluation.charStatusAt(1)).toBe('neutral');
    expect(evaluation.charStatusAt(2)).toBe('miss');
  });

  it('accepts when only second 1-based position matches', () => {
    const entry = new PasswordEntry(1, 3, 'c', 'xbcde');
    const evaluation = TOBOGGAN_POLICY.evaluate(entry);

    expect(evaluation.isValid).toBe(true);
    expect(evaluation.matchedIndices).toEqual([2]);
    expect(evaluation.charStatusAt(0)).toBe('miss');
    expect(evaluation.charStatusAt(2)).toBe('match');
  });

  it('rejects when both positions match or neither matches', () => {
    const bothMatch = TOBOGGAN_POLICY.evaluate(new PasswordEntry(2, 9, 'c', 'ccccccccc'));
    expect(bothMatch.isValid).toBe(false);
    expect(bothMatch.matchedIndices).toEqual([1, 8]);

    const neitherMatch = TOBOGGAN_POLICY.evaluate(new PasswordEntry(1, 3, 'b', 'cdefg'));
    expect(neitherMatch.isValid).toBe(false);
    expect(neitherMatch.matchedIndices).toEqual([]);
  });

  it('handles equal indices and out-of-bounds positions cleanly', () => {
    const samePos = TOBOGGAN_POLICY.evaluate(new PasswordEntry(2, 2, 'a', 'bab'));
    expect(samePos.isValid).toBe(false);
    expect(samePos.checkedIndices).toEqual([1, 1]);
    expect(samePos.matchedIndices).toEqual([1, 1]);

    const oob = TOBOGGAN_POLICY.evaluate(new PasswordEntry(1, 5, 'a', 'ab'));
    expect(oob.isValid).toBe(true);
    expect(oob.checkedIndices).toEqual([0, 4]);
    expect(oob.matchedIndices).toEqual([0]);
    expect(oob.charStatusAt(4)).toBe('miss');
  });
});
