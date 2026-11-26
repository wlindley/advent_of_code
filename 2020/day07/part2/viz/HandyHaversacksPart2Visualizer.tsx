import type { VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_TARGET_COLOR, NESTED_BAG_COUNT_POLICY } from '../../shared';
import { HaversackVisualizer } from '../../shared/viz/HaversackVisualizer';

/** Part 2 interactive visualizer for topological nested bag multiplicity. */
export function HandyHaversacksPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <HaversackVisualizer
      rawInput={rawInput}
      policy={NESTED_BAG_COUNT_POLICY}
      targetColor={DEFAULT_TARGET_COLOR}
    />
  );
}
