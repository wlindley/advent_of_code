import type { VisualizerProps } from '../../../../shared/viz';
import { MemoryGameVisualizer } from '../../shared/viz/MemoryGameVisualizer';
import { solver } from '../domain';

/** Interactive Part 1 (2020-turn) memory game visualizer. */
export function MemoryGamePart1Visualizer({ rawInput }: VisualizerProps) {
  return <MemoryGameVisualizer rawInput={rawInput} solver={solver} />;
}
