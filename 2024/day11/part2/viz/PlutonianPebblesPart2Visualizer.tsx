import type { VisualizerProps } from '../../../../shared/viz';
import { PebbleEvolutionVisualizer } from '../../shared/viz/PebbleEvolutionVisualizer';
import { PART2_BLINKS, solver } from '../domain';

/** Part 2 visualizer displaying Plutonian pebble evolution over 75 blinks. */
export function PlutonianPebblesPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <PebbleEvolutionVisualizer
      rawInput={rawInput}
      solver={solver}
      blinkCount={PART2_BLINKS}
    />
  );
}
