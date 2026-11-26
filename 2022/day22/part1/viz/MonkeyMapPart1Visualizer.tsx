import type { VisualizerProps } from '../../../../shared/viz';
import { MonkeyMapVisualizer } from '../../shared/viz/MonkeyMapVisualizer';
import { solver } from '../domain';

/** Part 1 interactive visualizer showing flat-torus board traversal and wraps. */
export function MonkeyMapPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <MonkeyMapVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (Flat Torus)"
    />
  );
}
