import type { VisualizerProps } from '../../../../shared/viz';
import { MonkeyMathVisualizer } from '../../shared/viz/MonkeyMathVisualizer';
import { solver } from '../domain';

/** Part 2 interactive visualizer showing top-down equality inversion toward `humn`. */
export function MonkeyMathPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <MonkeyMathVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Solve for humn)"
    />
  );
}
