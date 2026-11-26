import type { VisualizerProps } from '../../../../shared/viz';
import { CosmicExpansionVisualizer } from '../../shared/viz/CosmicExpansionVisualizer';
import { PART1_EXPANSION_FACTOR, solver } from '../domain';

/** Part 1 wrapper binding expansion factor 2n to the shared Cosmic Expansion visualizer. */
export function CosmicExpansionPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CosmicExpansionVisualizer
      rawInput={rawInput}
      expansionFactor={PART1_EXPANSION_FACTOR}
      solver={solver}
    />
  );
}
