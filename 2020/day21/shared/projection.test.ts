import { describe, expect, it } from 'vitest';
import { parseAllergenDocument } from './model';
import { DANGEROUS_LIST_POLICY, SAFE_APPEARANCES_POLICY } from './policies';
import { projectIntersectionBars, projectPeelingMatrix } from './projection';

const EXAMPLE = [
  'mxmxvkd kfcds sqjhc nhms (contains dairy, fish)',
  'trh fvjkl sbzzf mxmxvkd (contains dairy)',
  'sqjhc fvjkl (contains soy)',
  'sqjhc mxmxvkd sbzzf (contains fish)',
].join('\n');

describe('2020 Day 21 SVG projections', () => {
  it('projects intersection bars with all 4 states, safe/suspect partition, and preview truncation', () => {
    const doc = parseAllergenDocument(EXAMPLE);
    const frames = SAFE_APPEARANCES_POLICY.trace(doc, 80);

    // Frame 1 (food 1: trh fvjkl sbzzf mxmxvkd, contains dairy):
    // dairy -> {mxmxvkd}, fish -> {kfcds, mxmxvkd, nhms, sqjhc}, soy -> all 7!
    // Wait: at final frame (food 3): suspects = {fvjkl, mxmxvkd, sqjhc}, safe = {kfcds, nhms, sbzzf, trh}.
    // Food 3 has: sqjhc (active-suspect), mxmxvkd (active-suspect), sbzzf (active-safe).
    // Not in food 3: fvjkl (suspect), kfcds/nhms/trh (safe).
    const finalProj = projectIntersectionBars(frames[3]!, 2);
    expect(finalProj.maxFrequency).toBe(3);
    expect(finalProj.totalSuspectCount).toBe(3);
    expect(finalProj.totalSafeCount).toBe(4);
    expect(finalProj.hiddenSuspectCount).toBe(1);
    expect(finalProj.hiddenSafeCount).toBe(2);
    expect(finalProj.suspectBars.length).toBe(2);
    expect(finalProj.safeBars.length).toBe(2);

    const fullProj = projectIntersectionBars(frames[3]!, 10);
    const states = new Map(
      [...fullProj.suspectBars, ...fullProj.safeBars].map((bar) => [bar.name, bar.state]),
    );
    expect(states.get('mxmxvkd')).toBe('active-suspect');
    expect(states.get('sqjhc')).toBe('active-suspect');
    expect(states.get('fvjkl')).toBe('suspect');
    expect(states.get('sbzzf')).toBe('active-safe');
    expect(states.get('kfcds')).toBe('safe');

    // Frame 0 has soy with 7 candidates -> candidate preview truncation (+3)
    const frame0Proj = projectIntersectionBars(frames[0]!, 10);
    const soySummary = frame0Proj.allergens.find((a) => a.name === 'soy')!;
    expect(soySummary.isInCurrentFood).toBe(false);
    expect(soySummary.candidateCount).toBe(7);
    expect(soySummary.candidatePreview).toContain('(+3)');

    const dairySummary = frame0Proj.allergens.find((a) => a.name === 'dairy')!;
    expect(dairySummary.isInCurrentFood).toBe(true);
    expect(dairySummary.candidatePreview).toBe('kfcds, mxmxvkd, nhms, sqjhc');
  });

  it('projects peeling matrix across all 4 cell states: active-lock, locked, candidate, eliminated', () => {
    const doc = parseAllergenDocument(EXAMPLE);
    const frames = DANGEROUS_LIST_POLICY.trace(doc, 80);

    // Round 2 (frames[2]): dairy was locked in round 1 ('locked'), fish locks sqjhc ('active-lock'),
    // soy still has candidates {fvjkl} or round 1 has soy with {fvjkl, sqjhc}!
    const round1 = projectPeelingMatrix(frames[1]!);
    expect(round1.columns.map((c) => c.ingredient)).toEqual(['fvjkl', 'mxmxvkd', 'sqjhc']);
    expect(round1.rows[0]!.allergen).toBe('dairy');
    expect(round1.rows[0]!.lockedIngredientId).not.toBeNull();
    expect(round1.rows[0]!.cells).toEqual(['eliminated', 'active-lock', 'eliminated']);
    expect(round1.rows[1]!.cells).toEqual(['eliminated', 'eliminated', 'candidate']);

    const round2 = projectPeelingMatrix(frames[2]!);
    expect(round2.rows[0]!.cells).toEqual(['eliminated', 'locked', 'eliminated']);
    expect(round2.rows[1]!.cells).toEqual(['eliminated', 'eliminated', 'active-lock']);
    expect(round2.rows[2]!.lockedIngredientId).toBeNull();
    expect(round2.rows[2]!.cells).toEqual(['candidate', 'eliminated', 'eliminated']);
  });
});
