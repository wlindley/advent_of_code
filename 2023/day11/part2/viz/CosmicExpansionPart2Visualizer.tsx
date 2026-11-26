import type { VisualizerProps } from '../../../../shared/viz';
import { CosmicExpansionVisualizer } from '../../shared/viz/CosmicExpansionVisualizer';
import { PART2_EXPANSION_FACTOR, solver } from '../domain';

/** Part 2 wrapper binding expansion factor 1_000_000n to the shared Cosmic Expansion visualizer. */
export function CosmicExpansionPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CosmicExpansionVisualizer
      rawInput={rawInput}
      expansionFactor={PART2_EXPANSION_FACTOR}
      solver={solver}
    />
  );
}
