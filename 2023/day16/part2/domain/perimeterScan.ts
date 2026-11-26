import type { TraceOptions } from '../../../../shared/core';
import { BeamTracer, type BeamWaveFrame, type Contraption, type EdgeBeamScore } from '../../shared';

/** Immutable perimeter scan result storing every inward edge entry's energized tile count. */
export class PerimeterScanResult {
  readonly scores: readonly EdgeBeamScore[];

  constructor(scores: readonly EdgeBeamScore[]) {
    if (scores.length === 0) {
      throw new RangeError('PerimeterScanResult requires at least one edge score');
    }
    const copied: EdgeBeamScore[] = [];
    for (const score of scores) {
      if (!Number.isInteger(score.energizedCount) || score.energizedCount < 1) {
        throw new RangeError(`energizedCount must be a positive integer, got ${score.energizedCount}`);
      }
      copied.push(
        Object.freeze({ entry: Object.freeze({ ...score.entry }), energizedCount: score.energizedCount }),
      );
    }
    this.scores = Object.freeze(copied);
    Object.freeze(this);
  }

  /** Dynamically returns the highest-scoring perimeter entry (first-in-scan-order on ties). */
  get best(): EdgeBeamScore {
    let best = this.scores[0]!;
    for (let i = 1; i < this.scores.length; i += 1) {
      const candidate = this.scores[i]!;
      if (candidate.energizedCount > best.energizedCount) best = candidate;
    }
    return best;
  }
}

export interface OptimalPerimeterTrace {
  readonly scan: PerimeterScanResult;
  readonly frames: readonly BeamWaveFrame[];
}

function scanWithTracer(contraption: Contraption, tracer: BeamTracer): PerimeterScanResult {
  const scores: EdgeBeamScore[] = [];
  for (const entry of contraption.edgeEntries()) {
    scores.push({ entry, energizedCount: tracer.countEnergized(entry) });
  }
  return new PerimeterScanResult(scores);
}

/** Evaluates all inward perimeter entries of `contraption` using a single reusable `BeamTracer`. */
export function scanPerimeter(contraption: Contraption): PerimeterScanResult {
  return scanWithTracer(contraption, new BeamTracer(contraption));
}

/** Scans all perimeter entries and traces the wavefront expansion from the optimal entry. */
export function traceOptimalPerimeter(contraption: Contraption, options?: TraceOptions): OptimalPerimeterTrace {
  const tracer = new BeamTracer(contraption);
  const scan = scanWithTracer(contraption, tracer);
  const frames = tracer.traceWaves(scan.best.entry, options);
  return Object.freeze({ scan, frames });
}
