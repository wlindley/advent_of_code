import type { PeakContributionMetric } from '../../shared';

/** Part 2 peak metric: each reachable `9` peak contributes its distinct uphill trail count. */
export const RATING_METRIC: PeakContributionMetric = Object.freeze({
  mode: 'rating',
  peakValue(pathCount: number): number {
    if (!Number.isInteger(pathCount) || pathCount < 1) {
      throw new RangeError(`Peak pathCount must be a positive integer, got ${pathCount}`);
    }
    return pathCount;
  },
});
