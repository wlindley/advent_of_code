import { bitCount } from '../../../shared/core';
import type { AllergenAssignment } from './analysis';
import type { IntersectionTraceFrame, PeelingTraceFrame } from './traceFrames';

export const MAX_INTERSECTION_BARS = 10;
const MAX_CANDIDATE_PREVIEW = 4;

export type IntersectionBarState = 'active-safe' | 'active-suspect' | 'safe' | 'suspect';
export type PeelingCellState = 'active-lock' | 'locked' | 'candidate' | 'eliminated';

export interface IntersectionBar {
  readonly ingredientId: number;
  readonly name: string;
  readonly frequency: number;
  readonly isSafe: boolean;
  readonly isInCurrentFood: boolean;
  readonly state: IntersectionBarState;
  readonly barFrac: number;
}

export interface AllergenCandidateSummary {
  readonly allergenId: number;
  readonly name: string;
  readonly candidateCount: number;
  readonly isInCurrentFood: boolean;
  readonly candidatePreview: string;
}

export interface IntersectionProjection {
  readonly allergens: readonly AllergenCandidateSummary[];
  readonly suspectBars: readonly IntersectionBar[];
  readonly safeBars: readonly IntersectionBar[];
  readonly totalSuspectCount: number;
  readonly totalSafeCount: number;
  readonly hiddenSuspectCount: number;
  readonly hiddenSafeCount: number;
  readonly maxFrequency: number;
}

export interface PeelingMatrixRow {
  readonly allergenId: number;
  readonly allergen: string;
  readonly degree: number;
  readonly lockedIngredientId: number | null;
  readonly cells: readonly PeelingCellState[];
}

export interface PeelingMatrixProjection {
  readonly columns: readonly { readonly ingredientId: number; readonly ingredient: string }[];
  readonly rows: readonly PeelingMatrixRow[];
}

function classifyBarState(isSafe: boolean, isInCurrentFood: boolean): IntersectionBarState {
  if (isSafe) return isInCurrentFood ? 'active-safe' : 'safe';
  return isInCurrentFood ? 'active-suspect' : 'suspect';
}

function formatCandidatePreview(mask: bigint, ingredients: readonly string[], candidateCount: number): string {
  const names: string[] = [];
  for (let i = 0; i < ingredients.length && names.length < MAX_CANDIDATE_PREVIEW; i += 1) {
    if ((mask & (1n << BigInt(i))) !== 0n) names.push(ingredients[i]!);
  }
  const extra = candidateCount - names.length;
  return extra > 0 ? `${names.join(', ')} (+${extra})` : names.join(', ');
}

function compareBars(a: IntersectionBar, b: IntersectionBar): number {
  return b.frequency - a.frequency || a.ingredientId - b.ingredientId;
}

function projectAllergenSummaries(frame: IntersectionTraceFrame): readonly AllergenCandidateSummary[] {
  const activeAllergens = new Set(frame.currentFood.allergenIds);
  return Object.freeze(frame.doc.allergens.map((name, allergenId) => {
    const mask = frame.candidateMasks[allergenId]!;
    const candidateCount = bitCount(mask);
    return Object.freeze({
      allergenId, name, candidateCount, isInCurrentFood: activeAllergens.has(allergenId),
      candidatePreview: formatCandidatePreview(mask, frame.doc.ingredients, candidateCount),
    });
  }));
}

/** Projects an IntersectionTraceFrame into partitioned safe/suspect bars and allergen summaries. */
export function projectIntersectionBars(frame: IntersectionTraceFrame, maxBarsPerGroup: number): IntersectionProjection {
  const { doc, safeMask, currentFood } = frame;
  const freqs = doc.ingredientFrequencies;
  const maxFrequency = Math.max(1, ...freqs);
  const activeIngs = new Set(currentFood.ingredientIds);
  const suspect: IntersectionBar[] = [];
  const safe: IntersectionBar[] = [];
  for (let id = 0; id < doc.ingredientCount; id += 1) {
    const isSafe = (safeMask & (1n << BigInt(id))) !== 0n;
    const isInCurrentFood = activeIngs.has(id);
    const frequency = freqs[id]!;
    const bar: IntersectionBar = Object.freeze({
      ingredientId: id, name: doc.ingredients[id]!, frequency, isSafe, isInCurrentFood,
      state: classifyBarState(isSafe, isInCurrentFood), barFrac: frequency / maxFrequency,
    });
    if (isSafe) safe.push(bar);
    else suspect.push(bar);
  }
  suspect.sort(compareBars);
  safe.sort(compareBars);
  return Object.freeze({
    allergens: projectAllergenSummaries(frame),
    suspectBars: Object.freeze(suspect.slice(0, maxBarsPerGroup)),
    safeBars: Object.freeze(safe.slice(0, maxBarsPerGroup)),
    totalSuspectCount: suspect.length, totalSafeCount: safe.length,
    hiddenSuspectCount: Math.max(0, suspect.length - maxBarsPerGroup),
    hiddenSafeCount: Math.max(0, safe.length - maxBarsPerGroup), maxFrequency,
  });
}

function indexAssignments(assignments: readonly AllergenAssignment[]): ReadonlyMap<number, number> {
  const map = new Map<number, number>();
  for (const entry of assignments) map.set(entry.allergenId, entry.ingredientId);
  return map;
}

function classifyCell(ingId: number, mask: bigint, activeIng: number | undefined, priorIng: number | undefined): PeelingCellState {
  if (activeIng === ingId) return 'active-lock';
  if (priorIng === ingId) return 'locked';
  if (activeIng === undefined && priorIng === undefined && (mask & (1n << BigInt(ingId))) !== 0n) return 'candidate';
  return 'eliminated';
}

/** Projects a PeelingTraceFrame onto an allergen-by-suspect-ingredient matrix. */
export function projectPeelingMatrix(frame: PeelingTraceFrame): PeelingMatrixProjection {
  const priorMap = indexAssignments(frame.priorAssignments);
  const activeMap = indexAssignments(frame.activeLocks);
  const columns = Object.freeze(frame.suspectIngredientIds.map((ingredientId) =>
    Object.freeze({ ingredientId, ingredient: frame.doc.ingredients[ingredientId]! })));
  const rows = Object.freeze(frame.doc.allergens.map((allergen, allergenId) => {
    const mask = frame.masks[allergenId]!;
    const activeIng = activeMap.get(allergenId);
    const priorIng = priorMap.get(allergenId);
    const cells = Object.freeze(frame.suspectIngredientIds.map((id) => classifyCell(id, mask, activeIng, priorIng)));
    return Object.freeze({ allergenId, allergen, degree: bitCount(mask), lockedIngredientId: activeIng ?? priorIng ?? null, cells });
  }));
  return Object.freeze({ columns, rows });
}
