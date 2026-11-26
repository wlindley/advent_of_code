import type { VisualizerProps } from '../../../../shared/viz';
import { PebbleEvolutionVisualizer } from '../../shared/viz/PebbleEvolutionVisualizer';
import { PART1_BLINKS, solver } from '../domain';

/** Part 1 visualizer displaying Plutonian pebble evolution over 25 blinks. */
export function PlutonianPebblesPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <PebbleEvolutionVisualizer
      rawInput={rawInput}
      solver={solver}
      blinkCount={PART1_BLINKS}
    />
  );
}
