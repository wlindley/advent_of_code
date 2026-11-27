import { sampleTraceIndices } from '../../../shared/core';
import { type AllergenAssignment, analyzeAllergens, resolveAllergenMapping } from './analysis';
import type { AllergenDocument } from './model';
import { IntersectionTraceFrame, PeelingTraceFrame } from './traceFrames';

export type AllergenPolicyId = 'safe-appearances' | 'dangerous-list';

/** Pluggable evaluation and trace policy separating Part 1 and Part 2. */
export interface AllergenPolicy<TAnswer, TTrace> {
  readonly id: AllergenPolicyId;
  readonly label: string;
  solve(doc: AllergenDocument): TAnswer;
  trace(doc: AllergenDocument, maxSteps: number): readonly TTrace[];
}

function buildIntersectionFrames(doc: AllergenDocument, maxSteps: number): readonly IntersectionTraceFrame[] {
  analyzeAllergens(doc);
  const wanted = new Set(sampleTraceIndices(doc.foodCount, maxSteps));
  const masks = new Array<bigint>(doc.allergenCount).fill(doc.allIngredientsMask);
  const frames: IntersectionTraceFrame[] = [];
  for (let i = 0; i < doc.foodCount; i += 1) {
    const food = doc.foods[i]!;
    const fMask = food.ingredientMask;
    for (const aId of food.allergenIds) masks[aId] = masks[aId]! & fMask;
    if (wanted.has(i)) {
      frames.push(new IntersectionTraceFrame({ foodIndex: i, doc, candidateMasks: masks }));
    }
  }
  return Object.freeze(frames);
}

function buildPeelingFrames(doc: AllergenDocument, maxSteps: number): readonly PeelingTraceFrame[] {
  const analysis = analyzeAllergens(doc);
  const resolution = resolveAllergenMapping(analysis);
  const base = {
    totalRounds: resolution.rounds.length,
    doc,
    suspectIngredientIds: analysis.suspectIds,
    safeAppearances: analysis.safeAppearances,
  };
  const all: PeelingTraceFrame[] = [
    new PeelingTraceFrame({
      ...base,
      roundNumber: 0,
      masks: analysis.candidateMasks,
      priorAssignments: [],
      activeLocks: [],
    }),
  ];
  const cumulative: AllergenAssignment[] = [];
  for (const step of resolution.rounds) {
    all.push(new PeelingTraceFrame({
      ...base,
      roundNumber: step.round,
      masks: step.remainingMasks,
      priorAssignments: cumulative,
      activeLocks: step.locked,
    }));
    cumulative.push(...step.locked);
  }
  return Object.freeze(sampleTraceIndices(all.length, maxSteps).map((i) => all[i]!));
}

export const SAFE_APPEARANCES_POLICY: AllergenPolicy<number, IntersectionTraceFrame> = Object.freeze({
  id: 'safe-appearances',
  label: 'Safe Ingredient Appearances',
  solve(doc: AllergenDocument): number {
    return analyzeAllergens(doc).safeAppearances;
  },
  trace(doc: AllergenDocument, maxSteps: number): readonly IntersectionTraceFrame[] {
    return buildIntersectionFrames(doc, maxSteps);
  },
});

export const DANGEROUS_LIST_POLICY: AllergenPolicy<string, PeelingTraceFrame> = Object.freeze({
  id: 'dangerous-list',
  label: 'Canonical Dangerous List',
  solve(doc: AllergenDocument): string {
    return resolveAllergenMapping(analyzeAllergens(doc)).canonicalDangerousList;
  },
  trace(doc: AllergenDocument, maxSteps: number): readonly PeelingTraceFrame[] {
    return buildPeelingFrames(doc, maxSteps);
  },
});
