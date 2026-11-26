import type { VisualizerProps } from '../../../../shared/viz';
import { MonkeyMathVisualizer } from '../../shared/viz/MonkeyMathVisualizer';
import { solver } from '../domain';

/** Part 1 interactive visualizer showing bottom-up monkey evaluation toward `root`. */
export function MonkeyMathPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <MonkeyMathVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (Evaluate root)"
    />
  );
}
