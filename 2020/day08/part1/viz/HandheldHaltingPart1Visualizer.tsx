import type { VisualizerProps } from '../../../../shared/viz';
import { BootDebuggerVisualizer } from '../../shared/viz/BootDebuggerVisualizer';
import { solver } from '../domain';

/** Part 1 interactive debugger visualizer for infinite-loop accumulator detection. */
export function HandheldHaltingPart1Visualizer({ rawInput }: VisualizerProps) {
  return <BootDebuggerVisualizer rawInput={rawInput} solver={solver} />;
}
