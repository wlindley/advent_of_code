import { type CompressedValveNetwork, MAX_INT32 } from './compressedNetwork';

export interface ValveOpeningStep {
  readonly valveIndex: number;
  readonly valveName: string;
  readonly flowRate: number;
  readonly travelMinutes: number;
  readonly openedAtMinute: number;
}

/** Immutable valve-opening schedule storing source opening events only. */
export class ValveSchedule {
  readonly timeLimit: number;
  readonly steps: readonly ValveOpeningStep[];

  constructor(timeLimit: number, steps: readonly ValveOpeningStep[]) {
    assertTimeLimit(timeLimit);
    this.timeLimit = timeLimit;
    this.steps = Object.freeze(steps.map((s) => Object.freeze({ ...s })));
    Object.freeze(this);
  }

  get openedMask(): number {
    let mask = 0;
    for (const step of this.steps) mask |= 1 << step.valveIndex;
    return mask;
  }

  get totalPressure(): number {
    let total = 0;
    for (const step of this.steps) total += step.flowRate * (this.timeLimit - step.openedAtMinute);
    return total;
  }
}

/** Per-mask maximum releasable pressure table for subset-DP combination. */
export class MaskPressureTable {
  readonly valveCount: number;
  private readonly scores: Int32Array;

  constructor(valveCount: number, scores: Int32Array) {
    this.valveCount = valveCount;
    this.scores = scores;
    Object.freeze(this);
  }

  get maskCount(): number {
    return this.scores.length;
  }

  scoreFor(mask: number): number {
    if (!Number.isInteger(mask) || mask < 0 || mask >= this.scores.length) {
      throw new RangeError(`Mask out of bounds: ${mask}`);
    }
    return this.scores[mask]!;
  }

  copyScores(): Int32Array {
    return new Int32Array(this.scores);
  }
}

function assertTimeLimit(timeLimit: number): void {
  if (!Number.isSafeInteger(timeLimit) || timeLimit < 0) {
    throw new RangeError(`timeLimit must be a non-negative safe integer, got ${timeLimit}`);
  }
}

interface MaskSearchCtx {
  readonly compressed: CompressedValveNetwork;
  readonly scores: Int32Array;
}

function dfsMaskScores(ctx: MaskSearchCtx, node: number, mask: number, timeLeft: number, pressure: number): void {
  if (pressure > ctx.scores[mask]!) ctx.scores[mask] = pressure;
  const count = ctx.compressed.positiveCount;
  for (let next = 0; next < count; next++) {
    const bit = 1 << next;
    if ((mask & bit) !== 0) continue;
    const travel = ctx.compressed.distance(node, next);
    if (travel < 0) continue;
    const nextTimeLeft = timeLeft - travel - 1;
    if (nextTimeLeft <= 0) continue;
    const nextPressure = pressure + ctx.compressed.flowRateAt(next) * nextTimeLeft;
    if (nextPressure > MAX_INT32) throw new RangeError('Pressure exceeds MAX_INT32');
    dfsMaskScores(ctx, next, mask | bit, nextTimeLeft, nextPressure);
  }
}

/** Computes exact maximum pressure achievable for every reachable subset mask within `timeLimit`. */
export function computeBestByMask(compressed: CompressedValveNetwork, timeLimit: number): MaskPressureTable {
  assertTimeLimit(timeLimit);
  const scores = new Int32Array(1 << compressed.positiveCount);
  dfsMaskScores({ compressed, scores }, compressed.startIndex, 0, timeLimit, 0);
  return new MaskPressureTable(compressed.positiveCount, scores);
}

interface OptimalSearchCtx {
  readonly compressed: CompressedValveNetwork;
  readonly timeLimit: number;
  readonly allowedMask: number;
  readonly path: ValveOpeningStep[];
  bestPressure: number;
  bestSteps: ValveOpeningStep[];
}

function computeUpperBound(compressed: CompressedValveNetwork, node: number, remainingMask: number, timeLeft: number): number {
  const canOpenHere = node < compressed.positiveCount && (remainingMask & (1 << node)) !== 0;
  let rem = canOpenHere ? timeLeft - 1 : timeLeft - 2;
  let bound = 0;
  let m = remainingMask;
  while (m !== 0 && rem > 0) {
    const lsb = m & -m;
    bound += compressed.flowRateAt(31 - Math.clz32(lsb)) * rem;
    rem -= 2;
    m ^= lsb;
  }
  return bound;
}

function dfsOptimal(ctx: OptimalSearchCtx, node: number, mask: number, timeLeft: number, pressure: number): void {
  if (pressure > ctx.bestPressure) {
    ctx.bestPressure = pressure;
    ctx.bestSteps = ctx.path.slice();
  }
  const remainingMask = ctx.allowedMask & ~mask;
  if (pressure + computeUpperBound(ctx.compressed, node, remainingMask, timeLeft) <= ctx.bestPressure) return;

  let m = remainingMask;
  while (m !== 0) {
    const lsb = m & -m;
    const next = 31 - Math.clz32(lsb);
    m ^= lsb;
    const travel = ctx.compressed.distance(node, next);
    if (travel < 0) continue;
    const nextTimeLeft = timeLeft - travel - 1;
    if (nextTimeLeft <= 0) continue;
    const flowRate = ctx.compressed.flowRateAt(next);
    const nextPressure = pressure + flowRate * nextTimeLeft;
    if (!Number.isSafeInteger(nextPressure)) throw new RangeError('Pressure exceeds safe integer range');
    ctx.path.push({ valveIndex: next, valveName: ctx.compressed.nameAt(next), flowRate, travelMinutes: travel, openedAtMinute: ctx.timeLimit - nextTimeLeft });
    dfsOptimal(ctx, next, mask | lsb, nextTimeLeft, nextPressure);
    ctx.path.pop();
  }
}

/** Finds an optimal valve-opening schedule over `allowedMask` using admissible Branch-and-Bound. */
export function findOptimalSchedule(
  compressed: CompressedValveNetwork,
  timeLimit: number,
  allowedMask = compressed.fullMask,
): ValveSchedule {
  assertTimeLimit(timeLimit);
  if (!Number.isInteger(allowedMask) || allowedMask < 0 || allowedMask > compressed.fullMask) {
    throw new RangeError(`allowedMask out of range: ${allowedMask}`);
  }
  const ctx: OptimalSearchCtx = { compressed, timeLimit, allowedMask, path: [], bestPressure: 0, bestSteps: [] };
  dfsOptimal(ctx, compressed.startIndex, 0, timeLimit, 0);
  return new ValveSchedule(timeLimit, ctx.bestSteps);
}
