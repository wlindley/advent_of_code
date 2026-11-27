import { describe, expect, it } from 'vitest';
import {
  AllergenAnalysis,
  AllergenResolution,
  analyzeAllergens,
  PeelingRound,
  resolveAllergenMapping,
} from './analysis';
import { parseAllergenDocument } from './model';

const EXAMPLE = [
  'mxmxvkd kfcds sqjhc nhms (contains dairy, fish)',
  'trh fvjkl sbzzf mxmxvkd (contains dairy)',
  'sqjhc fvjkl (contains soy)',
  'sqjhc mxmxvkd sbzzf (contains fish)',
].join('\n');

describe('2020 Day 21 allergen analysis & peeling', () => {
  it('computes candidate masks, suspect/safe partitions, and safe appearances on the example', () => {
    const doc = parseAllergenDocument(EXAMPLE);
    const analysis = analyzeAllergens(doc);
    expect(analysis).toBeInstanceOf(AllergenAnalysis);
    expect(analysis.doc).toBe(doc);
    expect(analysis.suspectIds.map((id) => doc.ingredients[id])).toEqual(['fvjkl', 'mxmxvkd', 'sqjhc']);
    expect(analysis.safeIds.map((id) => doc.ingredients[id])).toEqual(['kfcds', 'nhms', 'sbzzf', 'trh']);
    expect(analysis.safeAppearances).toBe(5);
    expect(analysis.suspectMask | analysis.safeMask).toBe(doc.allIngredientsMask);
    expect(analysis.suspectMask & analysis.safeMask).toBe(0n);
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(Object.isFrozen(analysis.candidateMasks)).toBe(true);
    expect(Object.isFrozen(analysis.suspectIds)).toBe(true);
    expect(Object.isFrozen(analysis.safeIds)).toBe(true);
  });

  it('handles zero-allergen documents cleanly in both analysis and peeling', () => {
    const doc = parseAllergenDocument('alpha beta\nbeta gamma');
    const analysis = analyzeAllergens(doc);
    expect(analysis.suspectMask).toBe(0n);
    expect(analysis.safeAppearances).toBe(doc.totalAppearances);
    const resolution = resolveAllergenMapping(analysis);
    expect(resolution).toBeInstanceOf(AllergenResolution);
    expect(resolution.rounds).toEqual([]);
    expect(resolution.assignments).toEqual([]);
    expect(resolution.canonicalDangerousList).toBe('');
  });

  it('throws when any allergen has an empty candidate intersection', () => {
    const doc = parseAllergenDocument('alpha (contains dairy)\nbeta (contains dairy)');
    expect(() => analyzeAllergens(doc)).toThrow(/dairy/i);
  });

  it('resolves multi-round singleton peeling and builds ASCII-sorted canonical dangerous list', () => {
    const doc = parseAllergenDocument(EXAMPLE);
    const resolution = resolveAllergenMapping(analyzeAllergens(doc));
    expect(resolution.doc).toBe(doc);
    expect(resolution.rounds.length).toBe(3);
    expect(resolution.rounds[0]).toBeInstanceOf(PeelingRound);
    expect(resolution.rounds[0]!.round).toBe(1);
    expect(resolution.assignments.map((a) => `${a.allergen}:${a.ingredient}`)).toEqual([
      'dairy:mxmxvkd',
      'fish:sqjhc',
      'soy:fvjkl',
    ]);
    expect(resolution.canonicalDangerousList).toBe('mxmxvkd,sqjhc,fvjkl');
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution.rounds)).toBe(true);
  });

  it('resolves ingredients accurately past bit 60 via BigInt bitmasks', () => {
    const many = Array.from({ length: 65 }, (_, i) => `ing${String.fromCharCode(97 + Math.floor(i / 26))}${String.fromCharCode(97 + (i % 26))}`);
    const last = many[many.length - 1]!;
    const raw = `${many.join(' ')} (contains zebra)\n${last} (contains zebra)`;
    const resolution = resolveAllergenMapping(analyzeAllergens(parseAllergenDocument(raw)));
    expect(resolution.canonicalDangerousList).toBe(last);
  });

  it('throws on same-round collision, post-lock exhaustion, and ambiguous stall', () => {
    const collisionDoc = parseAllergenDocument('x (contains a)\nx y (contains b)\nx (contains b)');
    expect(() => resolveAllergenMapping(analyzeAllergens(collisionDoc))).toThrow(/collision/i);

    const exhaustDoc = parseAllergenDocument('x (contains a)\ny (contains b)\nx y (contains c)');
    expect(() => resolveAllergenMapping(analyzeAllergens(exhaustDoc))).toThrow(/no remaining/i);

    const stallDoc = parseAllergenDocument('x y (contains a, b)');
    expect(() => resolveAllergenMapping(analyzeAllergens(stallDoc))).toThrow(/ambiguous/i);
  });
});
