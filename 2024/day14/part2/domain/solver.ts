import { type PuzzleSolver, type TraceOptions, validateMaxSteps } from '../../../../shared/core';
import {
  DEFAULT_REDOUBT_SPACE,
  type RedoubtSnapshot,
  type Robot,
  type TorusSpace,
  buildRedoubtSnapshot,
  parseRobots,
} from '../../shared';
import { type EasterEggAnalysis, analyzeEasterEgg, findEasterEggSecond } from './analysis';

export const DEFAULT_MAX_TRACE_STEPS = 40;
export const DEFAULT_SPARKLINE_BINS = 160;
const APPROACH_WINDOW = 12;

export interface SparklineBin {
  readonly startSecond: number;
  readonly endSecond: number;
  readonly peakSecond: number;
  readonly peakScore: number;
}

/** Max-pools an adjacency series into at most `binCount` contiguous sparkline bins. */
export function downsamplePeakSeries(
  scores: readonly number[],
  binCount: number,
): readonly SparklineBin[] {
  const limit = validateMaxSteps(binCount, binCount);
  if (scores.length === 0) return Object.freeze([]);
  const effectiveBins = Math.min(limit, scores.length);
  const bins: SparklineBin[] = [];
  for (let b = 0; b < effectiveBins; b += 1) {
    const startSecond = Math.floor((b * scores.length) / effectiveBins);
    const endSecond = Math.floor(((b + 1) * scores.length) / effectiveBins) - 1;
    let peakSecond = startSecond;
    let peakScore = scores[startSecond]!;
    for (let t = startSecond + 1; t <= endSecond; t += 1) {
      const score = scores[t]!;
      if (score > peakScore) {
        peakScore = score;
        peakSecond = t;
      }
    }
    bins.push(Object.freeze({ startSecond, endSecond, peakSecond, peakScore }));
  }
  return Object.freeze(bins);
}

function frameLabel(second: number, best: number, tailStart: number): string {
  if (second === best) return 'Easter egg peak';
  if (second === 0) return 'Initial swarm';
  if (second >= tailStart) return 'Approach window';
  return 'Adjacency precursor';
}

function selectTraceSeconds(analysis: EasterEggAnalysis, limit: number): readonly number[] {
  const best = analysis.bestSecond;
  if (limit === 1) return [best];
  const selected = new Set<number>([best, 0]);
  const tailStart = Math.max(1, best - APPROACH_WINDOW);
  for (let t = best - 1; t >= tailStart && selected.size < limit; t -= 1) {
    selected.add(t);
  }
  if (selected.size < limit && best > 1) {
    const precursors: number[] = [];
    for (let t = 1; t < tailStart; t += 1) precursors.push(t);
    const scores = analysis.adjacencySeries;
    precursors.sort((a, b) => scores[b]! - scores[a]! || a - b);
    for (let i = 0; i < precursors.length && selected.size < limit; i += 1) {
      selected.add(precursors[i]!);
    }
  }
  return Array.from(selected).sort((a, b) => a - b);
}

/** Builds a bounded convergence trace focusing on `t = 0`, high precursors, and the peak approach. */
export function buildConvergenceTrace(
  robots: readonly Robot[],
  analysis: EasterEggAnalysis,
  options?: TraceOptions,
): readonly RedoubtSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const best = analysis.bestSecond;
  const tailStart = Math.max(1, best - APPROACH_WINDOW);
  const seconds = selectTraceSeconds(analysis, limit);
  const frames = seconds.map((t) =>
    buildRedoubtSnapshot(robots, analysis.space, t, {
      highlight: t === best,
      label: frameLabel(t, best, tailStart),
    }),
  );
  return Object.freeze(frames);
}

/** Analyzes `robots` in `space` and constructs a bounded convergence trace. */
export function traceEasterEggConvergence(
  robots: readonly Robot[],
  space: TorusSpace,
  options?: TraceOptions,
): readonly RedoubtSnapshot[] {
  return buildConvergenceTrace(robots, analyzeEasterEgg(robots, space), options);
}

/** Creates a parameterized Part 2 Easter-egg solver for `space`. */
export function createPart2Solver(
  space: TorusSpace = DEFAULT_REDOUBT_SPACE,
): PuzzleSolver<readonly Robot[], number, RedoubtSnapshot> {
  return Object.freeze<PuzzleSolver<readonly Robot[], number, RedoubtSnapshot>>({
    parse: parseRobots,
    solve: (robots) => findEasterEggSecond(robots, space),
    trace: (robots, options) => traceEasterEggConvergence(robots, space, options),
  });
}

export const solver = createPart2Solver(DEFAULT_REDOUBT_SPACE);
