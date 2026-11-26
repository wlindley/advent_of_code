import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { buildBuyerPriceWindow, evaluateBuyers, findBestBananaSequence } from './market';
import {
  type BuyerOutcome,
  DEFAULT_PRICE_WINDOW_SIZE,
  type MarketOptimizationResult,
  type MarketPriceWindow,
  type SecretSumResult,
} from './model';

export const DEFAULT_MAX_TRACE_STEPS = 48;

export type MarketTracePhase = 'step' | 'complete';

/** Immutable visualization frame capturing buyer outcomes, optional Part 2 leaderboard, and price window. */
export class MarketSnapshot {
  readonly phase: MarketTracePhase;
  readonly result: SecretSumResult;
  readonly optimization: MarketOptimizationResult | null;
  readonly activeBuyerIndex: number;
  readonly revealedBuyerCount: number;
  readonly activeWindow: MarketPriceWindow;

  constructor(
    phase: MarketTracePhase,
    result: SecretSumResult,
    optimization: MarketOptimizationResult | null,
    activeBuyerIndex: number,
    revealedBuyerCount: number,
    activeWindow: MarketPriceWindow,
  ) {
    this.phase = phase;
    this.result = result;
    this.optimization = optimization;
    this.activeBuyerIndex = activeBuyerIndex;
    this.revealedBuyerCount = revealedBuyerCount;
    this.activeWindow = activeWindow;
    Object.freeze(this);
  }

  get activeBuyer(): BuyerOutcome {
    return this.result.buyers[this.activeBuyerIndex]!;
  }

  get totalBuyers(): number {
    return this.result.buyers.length;
  }

  get revealedSecretSum(): bigint {
    let total = 0n;
    for (let i = 0; i < this.revealedBuyerCount; i += 1) {
      total += BigInt(this.result.buyers[i]!.finalSecret);
    }
    return total;
  }

  get totalFinalSecret(): bigint {
    return this.result.totalFinalSecret;
  }

  get isComplete(): boolean {
    return this.phase === 'complete';
  }
}

function assembleTraceFrames(
  result: SecretSumResult,
  optimization: MarketOptimizationResult | null,
  targetKey: number | null,
  options?: TraceOptions,
): readonly MarketSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const total = result.buyers.length;
  const lastIdx = total - 1;
  const completeWindow = buildBuyerPriceWindow(
    result.buyers[lastIdx]!.initialSecret,
    result.steps,
    targetKey,
    DEFAULT_PRICE_WINDOW_SIZE,
  );
  const completeFrame = new MarketSnapshot('complete', result, optimization, lastIdx, total, completeWindow);
  if (limit === 1) return Object.freeze([completeFrame]);

  const indices = sampleTraceIndices(total, limit - 1);
  const frames: MarketSnapshot[] = [];
  for (const idx of indices) {
    const window = buildBuyerPriceWindow(
      result.buyers[idx]!.initialSecret,
      result.steps,
      targetKey,
      DEFAULT_PRICE_WINDOW_SIZE,
    );
    frames.push(new MarketSnapshot('step', result, optimization, idx, idx + 1, window));
  }
  frames.push(completeFrame);
  return Object.freeze(frames);
}

/** Builds a bounded visualization trace for Part 1 buyer secret evolution. */
export function buildSecretSumTrace(
  seeds: readonly number[],
  steps: number,
  options?: TraceOptions,
): readonly MarketSnapshot[] {
  if (seeds.length === 0) throw new RangeError('buildSecretSumTrace requires at least one buyer seed');
  return assembleTraceFrames(evaluateBuyers(seeds, steps), null, null, options);
}

/** Builds a bounded visualization trace for Part 2 banana sequence optimization. */
export function buildBananaOptimizationTrace(
  seeds: readonly number[],
  steps: number,
  topK: number,
  options?: TraceOptions,
): readonly MarketSnapshot[] {
  if (seeds.length === 0) throw new RangeError('buildBananaOptimizationTrace requires at least one buyer seed');
  const result = evaluateBuyers(seeds, steps);
  const optimization = findBestBananaSequence(seeds, steps, topK);
  const targetKey = optimization.bestCandidate === null ? null : optimization.bestCandidate.key;
  return assembleTraceFrames(result, optimization, targetKey, options);
}
