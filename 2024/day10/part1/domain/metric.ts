import type { PeakContributionMetric } from '../../shared';

/** Part 1 peak metric: each reachable `9` peak contributes 1 regardless of path multiplicity. */
export const SCORE_METRIC: PeakContributionMetric = Object.freeze({
  mode: 'score',
  peakValue(pathCount: number): number {
    if (!Number.isInteger(pathCount) || pathCount < 1) {
      throw new RangeError(`Peak pathCount must be a positive integer, got ${pathCount}`);
    }
    return 1;
  },
});
