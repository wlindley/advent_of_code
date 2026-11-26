import type { VisualizerProps } from '../../../../shared/viz';
import { type MarketSnapshot, buildSecretSumTrace } from '../../shared';
import { MonkeyMarketVisualizer } from '../../shared/viz/MonkeyMarketVisualizer';
import { PART1_STEPS } from '../domain';

export const PART1_EXAMPLE_INPUT = ['1', '10', '100', '2024'].join('\n');

function buildPart1Trace(seeds: readonly number[]): readonly MarketSnapshot[] {
  return buildSecretSumTrace(seeds, PART1_STEPS);
}

/** Interactive Part 1 Monkey Market visualizer (2000th-secret buyer evolution). */
export function MonkeyMarketPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <MonkeyMarketVisualizer
      rawInput={rawInput}
      cacheKey={`part1-${PART1_STEPS}`}
      buildTrace={buildPart1Trace}
    />
  );
}
