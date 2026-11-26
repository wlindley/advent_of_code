import { type AgentRoute, type CompressedValveNetwork, computeBestByMask, findOptimalSchedule, type MaskPressureTable, MAX_INT32 } from '../../shared';

function assertAgentAssignment(label: string, mask: number, score: number): void {
  if (!Number.isInteger(mask) || mask < 0 || mask > MAX_INT32) {
    throw new RangeError(`${label} mask out of range: ${mask}`);
  }
  if (!Number.isSafeInteger(score) || score < 0) {
    throw new RangeError(`${label} score out of range: ${score}`);
  }
  if (mask === 0 && score > 0) {
    throw new Error(`${label} cannot have positive score ${score} with empty mask`);
  }
}

/** Immutable disjoint valve-subset assignment maximizing dual-agent pressure release. */
export class DualAgentPlan {
  readonly humanMask: number;
  readonly elephantMask: number;
  readonly humanScore: number;
  readonly elephantScore: number;

  constructor(humanMask: number, elephantMask: number, humanScore: number, elephantScore: number) {
    assertAgentAssignment('Human', humanMask, humanScore);
    assertAgentAssignment('Elephant', elephantMask, elephantScore);
    if ((humanMask & elephantMask) !== 0) {
      throw new Error('DualAgentPlan masks must be disjoint');
    }
    this.humanMask = humanMask;
    this.elephantMask = elephantMask;
    this.humanScore = humanScore;
    this.elephantScore = elephantScore;
    Object.freeze(this);
  }

  get totalPressure(): number {
    return this.humanScore + this.elephantScore;
  }

  get openedMask(): number {
    return this.humanMask | this.elephantMask;
  }
}

function buildSosMaximums(raw: Int32Array, valveCount: number): { readonly sosScore: Int32Array; readonly sosMask: Int32Array } {
  const maskCount = raw.length;
  const sosScore = raw.slice();
  const sosMask = new Int32Array(maskCount);
  for (let m = 0; m < maskCount; m++) {
    if (raw[m]! > 0) sosMask[m] = m;
  }
  for (let bit = 0; bit < valveCount; bit++) {
    const step = 1 << bit;
    for (let base = 0; base < maskCount; base += step << 1) {
      for (let offset = 0; offset < step; offset++) {
        const sub = base + offset;
        const mask = sub | step;
        if (sosScore[sub]! > sosScore[mask]!) {
          sosScore[mask] = sosScore[sub]!;
          sosMask[mask] = sosMask[sub]!;
        }
      }
    }
  }
  return { sosScore, sosMask };
}

function canonicalPlan(humanMask: number, elephantMask: number, humanScore: number, elephantScore: number): DualAgentPlan {
  return humanScore < elephantScore
    ? new DualAgentPlan(elephantMask, humanMask, elephantScore, humanScore)
    : new DualAgentPlan(humanMask, elephantMask, humanScore, elephantScore);
}

/** Finds an optimal disjoint subset-pair plan over `table` via Sum-over-Subsets DP in O(K * 2^K). */
export function findOptimalDualAgentPlan(table: MaskPressureTable): DualAgentPlan {
  const raw = table.copyScores();
  const fullMask = raw.length - 1;
  const { sosScore, sosMask } = buildSosMaximums(raw, table.valveCount);
  let bestHumanMask = 0, bestElephantMask = 0, bestHumanScore = 0, bestElephantScore = 0, bestTotal = 0;
  for (let m = 0; m < raw.length; m++) {
    const humanScore = raw[m]!;
    if (m !== 0 && humanScore === 0) continue;
    const comp = fullMask ^ m;
    const elephantScore = sosScore[comp]!;
    const total = humanScore + elephantScore;
    if (total > bestTotal) {
      bestTotal = total;
      bestHumanMask = m;
      bestElephantMask = sosMask[comp]!;
      bestHumanScore = humanScore;
      bestElephantScore = elephantScore;
    }
  }
  return canonicalPlan(bestHumanMask, bestElephantMask, bestHumanScore, bestElephantScore);
}

/** Computes optimal disjoint routes for `You` and `Elephant` over `timeLimit` minutes. */
export function findOptimalDualAgentRoutes(compressed: CompressedValveNetwork, timeLimit: number): readonly [AgentRoute, AgentRoute] {
  const plan = findOptimalDualAgentPlan(computeBestByMask(compressed, timeLimit));
  const humanSchedule = findOptimalSchedule(compressed, timeLimit, plan.humanMask);
  const elephantSchedule = findOptimalSchedule(compressed, timeLimit, plan.elephantMask);
  return Object.freeze([{ label: 'You', schedule: humanSchedule }, { label: 'Elephant', schedule: elephantSchedule }] as const);
}
