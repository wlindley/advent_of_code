import type { VisualizerProps } from '../../../../shared/viz';
import { GroveMixerVisualizer } from '../../shared/viz/GroveMixerVisualizer';
import { solver } from '../domain';

/** Part 1 visualizer animating one circular mixing pass with decryption key 1. */
export function GrovePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <GroveMixerVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (1 round, key = 1)"
    />
  );
}
