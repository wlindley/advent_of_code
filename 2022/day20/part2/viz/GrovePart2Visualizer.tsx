import type { VisualizerProps } from '../../../../shared/viz';
import { GroveMixerVisualizer } from '../../shared/viz/GroveMixerVisualizer';
import { solver } from '../domain';

/** Part 2 visualizer animating ten circular mixing rounds with decryption key 811589153. */
export function GrovePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <GroveMixerVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (10 rounds, key = 811589153)"
    />
  );
}
