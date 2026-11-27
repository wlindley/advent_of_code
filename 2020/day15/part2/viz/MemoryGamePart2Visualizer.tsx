import type { VisualizerProps } from '../../../../shared/viz';
import { MemoryGameVisualizer } from '../../shared/viz/MemoryGameVisualizer';
import { solver } from '../domain';

/** Interactive Part 2 (30,000,000-turn) memory game visualizer capped at the trace horizon. */
export function MemoryGamePart2Visualizer({ rawInput }: VisualizerProps) {
  return <MemoryGameVisualizer rawInput={rawInput} solver={solver} />;
}
