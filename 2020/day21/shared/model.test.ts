import { describe, expect, it } from 'vitest';
import { AllergenDocument, Food, parseAllergenDocument } from './model';

describe('2020 Day 21 allergen model', () => {
  it('parses foods, sorts vocabularies in ASCII order, and computes derived getters', () => {
    const raw = [
      '',
      'zeta alpha beta (contains soy, dairy)\r',
      'beta gamma\r',
      'alpha delta (contains dairy)\r',
      '',
    ].join('\n');

    const doc = parseAllergenDocument(raw);
    expect(doc).toBeInstanceOf(AllergenDocument);
    expect(doc.ingredients).toEqual(['alpha', 'beta', 'delta', 'gamma', 'zeta']);
    expect(doc.allergens).toEqual(['dairy', 'soy']);
    expect(doc.ingredientCount).toBe(5);
    expect(doc.allergenCount).toBe(2);
    expect(doc.foodCount).toBe(3);
    expect(doc.allIngredientsMask).toBe(0b11111n);
    expect(doc.ingredientFrequencies).toEqual([2, 2, 1, 1, 1]);
    expect(doc.totalAppearances).toBe(7);

    const food0 = doc.foods[0]!;
    expect(food0).toBeInstanceOf(Food);
    expect(food0.index).toBe(0);
    expect(food0.ingredientCount).toBe(3);
    expect(food0.allergenCount).toBe(2);
    expect(food0.ingredientMask).toBe(0b10011n);

    expect(Object.isFrozen(doc)).toBe(true);
    expect(Object.isFrozen(doc.ingredients)).toBe(true);
    expect(Object.isFrozen(doc.allergens)).toBe(true);
    expect(Object.isFrozen(doc.foods)).toBe(true);
    expect(Object.isFrozen(doc.ingredientFrequencies)).toBe(true);
    expect(Object.isFrozen(food0)).toBe(true);
    expect(Object.isFrozen(food0.ingredientIds)).toBe(true);
    expect(Object.isFrozen(food0.allergenIds)).toBe(true);
  });

  it('supports zero-allergen documents cleanly', () => {
    const doc = parseAllergenDocument('pear apple\nbanana');
    expect(doc.allergenCount).toBe(0);
    expect(doc.allergens).toEqual([]);
    expect(doc.foods[0]!.allergenIds).toEqual([]);
    expect(doc.totalAppearances).toBe(3);
  });

  it('rejects empty input and blank internal lines', () => {
    expect(() => parseAllergenDocument('  \r\n  ')).toThrow();
    expect(() => parseAllergenDocument('alpha\n\nbeta')).toThrow();
  });

  it('rejects missing ingredients and malformed parentheses or contains keyword', () => {
    expect(() => parseAllergenDocument('(contains dairy)')).toThrow();
    expect(() => parseAllergenDocument('alpha contains dairy)')).toThrow();
    expect(() => parseAllergenDocument('alpha (contains dairy')).toThrow();
    expect(() => parseAllergenDocument('alpha ((contains dairy))')).toThrow();
    expect(() => parseAllergenDocument('alpha (contains dairy) extra')).toThrow();
    expect(() => parseAllergenDocument('alpha (has dairy)')).toThrow();
    expect(() => parseAllergenDocument('alpha (containsdairy)')).toThrow();
  });

  it('rejects empty allergen lists, bad commas, non-lowercase tokens, and per-food duplicates', () => {
    expect(() => parseAllergenDocument('alpha (contains)')).toThrow();
    expect(() => parseAllergenDocument('alpha (contains   )')).toThrow();
    expect(() => parseAllergenDocument('alpha (contains dairy,)')).toThrow();
    expect(() => parseAllergenDocument('alpha (contains dairy,, fish)')).toThrow();
    expect(() => parseAllergenDocument('Alpha (contains dairy)')).toThrow();
    expect(() => parseAllergenDocument('alpha (contains Dairy)')).toThrow();
    expect(() => parseAllergenDocument('alpha alpha (contains dairy)')).toThrow();
    expect(() => parseAllergenDocument('alpha beta (contains dairy, dairy)')).toThrow();
  });
});
