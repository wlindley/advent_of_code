import type { VisualizerProps } from '../../../../shared/viz';
import { type MarketSnapshot, buildBananaOptimizationTrace } from '../../shared';
import { MonkeyMarketVisualizer } from '../../shared/viz/MonkeyMarketVisualizer';
import { PART2_LEADERBOARD_SIZE, PART2_STEPS } from '../domain';

export const PART2_EXAMPLE_INPUT = ['1', '2', '3', '2024'].join('\n');

function buildPart2Trace(seeds: readonly number[]): readonly MarketSnapshot[] {
  return buildBananaOptimizationTrace(seeds, PART2_STEPS, PART2_LEADERBOARD_SIZE);
}

/** Interactive Part 2 Monkey Market visualizer (4-delta banana optimization leaderboard). */
export function MonkeyMarketPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <MonkeyMarketVisualizer
      rawInput={rawInput}
      cacheKey={`part2-${PART2_STEPS}-${PART2_LEADERBOARD_SIZE}`}
      buildTrace={buildPart2Trace}
    />
  );
}
