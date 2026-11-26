import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import type { ExpenseEntry, ExpenseReport } from './expenseReport';
import { classifySum, walkKSum, type ProbeObserver, type ProbeVerdict } from './kSum';

export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Immutable snapshot of a single two-pointer probe step in a sorted k-sum walk. */
export class KSumTraceFrame {
  readonly #sorted: readonly ExpenseEntry[];
  readonly #anchorPositions: readonly number[];
  readonly #leftPos: number;
  readonly #rightPos: number;
  readonly #target: number;

  constructor(
    sorted: readonly ExpenseEntry[], anchorPositions: readonly number[],
    leftPos: number, rightPos: number, target: number,
  ) {
    this.#sorted = sorted;
    // Copy and freeze so caller backtracking (push/pop) never mutates recorded frames.
    this.#anchorPositions = Object.freeze([...anchorPositions]);
    this.#leftPos = leftPos;
    this.#rightPos = rightPos;
    this.#target = target;
    Object.freeze(this);
  }

  get anchorPositions(): readonly number[] { return this.#anchorPositions; }
  get leftPos(): number { return this.#leftPos; }
  get rightPos(): number { return this.#rightPos; }
  get target(): number { return this.#target; }

  get selectedPositions(): readonly number[] {
    return Object.freeze([...this.#anchorPositions, this.#leftPos, this.#rightPos]);
  }

  get selectedEntries(): readonly ExpenseEntry[] {
    return Object.freeze(this.selectedPositions.map((pos) => this.#sorted[pos]!));
  }

  get sum(): number { return this.selectedEntries.reduce((acc, entry) => acc + entry.value, 0); }
  get delta(): number { return this.sum - this.#target; }
  get verdict(): ProbeVerdict { return classifySum(this.sum, this.#target); }

  get product(): number | null {
    return this.verdict === 'match' ? this.selectedEntries.reduce((acc, entry) => acc * entry.value, 1) : null;
  }
}

class CountingObserver implements ProbeObserver {
  count = 0;

  onProbe(
    _sorted: readonly ExpenseEntry[], _anchorPositions: readonly number[],
    _leftPos: number, _rightPos: number, _sum: number, verdict: ProbeVerdict,
  ): boolean {
    this.count += 1;
    return verdict === 'match';
  }
}

class SamplingObserver implements ProbeObserver {
  readonly #target: number;
  readonly #keepIndices: readonly number[];
  readonly #frames: KSumTraceFrame[] = [];
  #cursor = 0;
  #step = 0;

  constructor(target: number, keepIndices: readonly number[]) {
    this.#target = target;
    this.#keepIndices = keepIndices;
  }

  get frames(): readonly KSumTraceFrame[] { return Object.freeze([...this.#frames]); }

  onProbe(
    sorted: readonly ExpenseEntry[], anchorPositions: readonly number[],
    leftPos: number, rightPos: number, _sum: number, verdict: ProbeVerdict,
  ): boolean {
    if (this.#keepIndices[this.#cursor] === this.#step) {
      this.#frames.push(new KSumTraceFrame(sorted, anchorPositions, leftPos, rightPos, this.#target));
      this.#cursor += 1;
    }
    this.#step += 1;
    return verdict === 'match';
  }
}

/** Captures up to `maxSteps` uniformly sampled probe frames for a sorted k-sum walk. */
export function traceKSumSearch(
  report: ExpenseReport, tupleSize: number, target: number, maxSteps?: number,
): readonly KSumTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const counter = new CountingObserver();
  walkKSum(report, tupleSize, target, counter);
  const keepIndices = sampleTraceIndices(counter.count, limit);
  const sampler = new SamplingObserver(target, keepIndices);
  walkKSum(report, tupleSize, target, sampler);
  return sampler.frames;
}
