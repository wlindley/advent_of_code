import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { OasisReport } from './parser';
import { DifferencePyramid } from './pyramid';
import type {
  ExtrapolationOperator,
  ExtrapolationResult,
  ExtrapolationStrategy,
} from './strategy';

/** Default frame cap so large OASIS reports render instantaneously. */
export const DEFAULT_MAX_TRACE_STEPS = 160;

/** Stage of difference-pyramid construction and extrapolation for a history. */
export type OasisTracePhase = 'descend' | 'baseline' | 'ascend';

/** Exact bottom-up arithmetic step active during the `ascend` phase. */
export interface ExtrapolationEquation {
  readonly layer: number;
  readonly anchor: bigint;
  readonly operator: ExtrapolationOperator;
  readonly below: bigint;
  readonly result: bigint;
}

/** Canonical initialization fields for `OasisTraceFrame`. */
export interface OasisTraceFrameInit {
  readonly step: number;
  readonly totalSteps: number;
  readonly historyIndex: number;
  readonly historyCount: number;
  readonly phase: OasisTracePhase;
  readonly activeLayer: number;
  readonly pyramid: DifferencePyramid;
  readonly extrapolation: ExtrapolationResult;
  readonly strategy: ExtrapolationStrategy;
  readonly priorSum: bigint;
}

/**
 * Immutable snapshot of one OASIS extrapolation step.
 * Stores only canonical state; presentation properties are derived dynamically.
 */
export class OasisTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly historyIndex: number;
  readonly historyCount: number;
  readonly phase: OasisTracePhase;
  readonly activeLayer: number;
  readonly pyramid: DifferencePyramid;
  readonly extrapolation: ExtrapolationResult;
  readonly strategy: ExtrapolationStrategy;
  readonly priorSum: bigint;

  constructor(init: OasisTraceFrameInit) {
    this.step = init.step;
    this.totalSteps = init.totalSteps;
    this.historyIndex = init.historyIndex;
    this.historyCount = init.historyCount;
    this.phase = init.phase;
    this.activeLayer = init.activeLayer;
    this.pyramid = init.pyramid;
    this.extrapolation = init.extrapolation;
    this.strategy = init.strategy;
    this.priorSum = init.priorSum;
    Object.freeze(this);
  }

  /** Number of difference layers currently revealed from the top. */
  get revealedDepth(): number {
    return this.phase === 'descend' ? this.activeLayer + 1 : this.pyramid.depth;
  }

  /** Lowest layer index whose extrapolated edge value is populated (`null` during `descend`). */
  get extrapolatedFromLayer(): number | null {
    return this.phase === 'descend' ? null : this.activeLayer;
  }

  /** True once the current history's top-layer extrapolated value is populated. */
  get isHistoryComplete(): boolean {
    return this.phase !== 'descend' && this.activeLayer === 0;
  }

  /** Cumulative report total including the active history once completed. */
  get runningTotal(): bigint {
    return this.priorSum + (this.isHistoryComplete ? this.extrapolation.value : 0n);
  }

  /** Active arithmetic combine step during `ascend`, or `null` otherwise. */
  get activeEquation(): ExtrapolationEquation | null {
    if (this.phase !== 'ascend') return null;
    const layer = this.activeLayer;
    return Object.freeze({
      layer,
      anchor: this.strategy.anchorOf(this.pyramid.layers[layer]!),
      operator: this.strategy.operatorSymbol,
      below: this.extrapolation.valuesByLayer[layer + 1]!,
      result: this.extrapolation.valuesByLayer[layer]!,
    });
  }
}

interface TimelineEntry {
  readonly pyramid: DifferencePyramid;
  readonly extrapolation: ExtrapolationResult;
  readonly startStep: number;
  readonly stepCount: number;
  readonly priorSum: bigint;
}

function buildTimeline(
  report: OasisReport,
  strategy: ExtrapolationStrategy,
): { readonly entries: readonly TimelineEntry[]; readonly totalSteps: number } {
  const entries: TimelineEntry[] = [];
  let totalSteps = 0;
  let priorSum = 0n;
  for (const history of report.histories) {
    const pyramid = DifferencePyramid.fromHistory(history);
    const extrapolation = pyramid.extrapolate(strategy);
    const stepCount = 2 * pyramid.depth - 1;
    entries.push({ pyramid, extrapolation, startStep: totalSteps, stepCount, priorSum });
    totalSteps += stepCount;
    priorSum += extrapolation.value;
  }
  return { entries, totalSteps };
}

function resolvePhaseAndLayer(
  localStep: number,
  depth: number,
): { readonly phase: OasisTracePhase; readonly activeLayer: number } {
  const baseIndex = depth - 1;
  if (localStep < baseIndex) return { phase: 'descend', activeLayer: localStep };
  if (localStep === baseIndex) return { phase: 'baseline', activeLayer: baseIndex };
  return { phase: 'ascend', activeLayer: 2 * baseIndex - localStep };
}

/**
 * Generates a bounded trace of OASIS pyramid descent, zero-baseline seeding,
 * and bottom-up extrapolation using lazy `O(N + maxSteps)` frame materialization.
 */
export function traceOasisReport(
  report: OasisReport,
  strategy: ExtrapolationStrategy,
  options?: TraceOptions,
): readonly OasisTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const { entries, totalSteps } = buildTimeline(report, strategy);
  const sampled = sampleTraceIndices(totalSteps, maxSteps);
  const frames: OasisTraceFrame[] = [];
  let cursor = 0;

  for (const globalStep of sampled) {
    while (globalStep >= entries[cursor]!.startStep + entries[cursor]!.stepCount) {
      cursor += 1;
    }
    const entry = entries[cursor]!;
    const { phase, activeLayer } = resolvePhaseAndLayer(
      globalStep - entry.startStep,
      entry.pyramid.depth,
    );
    frames.push(
      new OasisTraceFrame({
        step: globalStep,
        totalSteps,
        historyIndex: cursor,
        historyCount: entries.length,
        phase,
        activeLayer,
        pyramid: entry.pyramid,
        extrapolation: entry.extrapolation,
        strategy,
        priorSum: entry.priorSum,
      }),
    );
  }
  return Object.freeze(frames);
}
