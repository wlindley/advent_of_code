import type { VisualizerProps } from '../../../../shared/viz';
import { ANCESTOR_COLORS_POLICY, DEFAULT_TARGET_COLOR } from '../../shared';
import { HaversackVisualizer } from '../../shared/viz/HaversackVisualizer';

/** Part 1 interactive visualizer for reverse-BFS ancestor bag colors. */
export function HandyHaversacksPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <HaversackVisualizer
      rawInput={rawInput}
      policy={ANCESTOR_COLORS_POLICY}
      targetColor={DEFAULT_TARGET_COLOR}
    />
  );
}
