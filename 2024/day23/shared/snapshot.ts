import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { type LanClique, findMaximumCliqueHistory, findTriangles } from './cliques';
import type { LanGraph } from './graph';

export const DEFAULT_MAX_TRACE_STEPS = 48;

export type LanTracePhase = 'step' | 'complete';

/** Immutable visualization frame capturing discovered cliques and active selection state. */
export class LanPartySnapshot {
  readonly phase: LanTracePhase;
  readonly graph: LanGraph;
  readonly cliques: readonly LanClique[];
  readonly revealedCount: number;
  readonly filterPrefix: string;

  constructor(
    phase: LanTracePhase,
    graph: LanGraph,
    cliques: readonly LanClique[],
    revealedCount: number,
    filterPrefix: string,
  ) {
    if (!Number.isInteger(revealedCount) || revealedCount < 0 || revealedCount > cliques.length) {
      throw new RangeError(`revealedCount must be in [0, ${cliques.length}], got ${revealedCount}`);
    }
    this.phase = phase;
    this.graph = graph;
    this.cliques = cliques;
    this.revealedCount = revealedCount;
    this.filterPrefix = filterPrefix;
    Object.freeze(this);
  }

  get totalCliques(): number {
    return this.cliques.length;
  }

  get activeClique(): LanClique | null {
    return this.revealedCount === 0 ? null : this.cliques[this.revealedCount - 1]!;
  }

  get isComplete(): boolean {
    return this.phase === 'complete';
  }

  get largestRevealedSize(): number {
    let max = 0;
    for (let i = 0; i < this.revealedCount; i += 1) {
      const size = this.cliques[i]!.size;
      if (size > max) max = size;
    }
    return max;
  }
}

function assembleCliqueTrace(
  graph: LanGraph,
  cliques: readonly LanClique[],
  filterPrefix: string,
  options?: TraceOptions,
): readonly LanPartySnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const total = cliques.length;
  const completeFrame = new LanPartySnapshot('complete', graph, cliques, total, filterPrefix);
  if (total === 0 || limit === 1) return Object.freeze([completeFrame]);

  const indices = sampleTraceIndices(total, limit - 1);
  const frames: LanPartySnapshot[] = [];
  for (const idx of indices) {
    frames.push(new LanPartySnapshot('step', graph, cliques, idx + 1, filterPrefix));
  }
  frames.push(completeFrame);
  return Object.freeze(frames);
}

/** Builds a bounded trace of canonical triangles matching `prefix`. */
export function buildTriangleTrace(
  graph: LanGraph,
  prefix: string,
  options?: TraceOptions,
): readonly LanPartySnapshot[] {
  return assembleCliqueTrace(graph, findTriangles(graph, prefix), prefix, options);
}

/** Builds a bounded trace of progressive maximum-clique discoveries. */
export function buildMaximumCliqueTrace(
  graph: LanGraph,
  options?: TraceOptions,
): readonly LanPartySnapshot[] {
  return assembleCliqueTrace(graph, findMaximumCliqueHistory(graph), '', options);
}
