import type { VisualizerProps } from '../../../../shared/viz';
import { BootDebuggerVisualizer } from '../../shared/viz/BootDebuggerVisualizer';
import { solver } from '../domain';

/** Part 2 interactive debugger visualizer for single-instruction boot repair. */
export function HandheldHaltingPart2Visualizer({ rawInput }: VisualizerProps) {
  return <BootDebuggerVisualizer rawInput={rawInput} solver={solver} />;
}
