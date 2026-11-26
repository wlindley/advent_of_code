import type { VisualizerProps } from '../../../../shared/viz';
import { ReindeerMazeVisualizer } from '../../shared/viz/ReindeerMazeVisualizer';
import { solver } from '../domain';

/** Interactive Dijkstra visualizer for Reindeer Maze Part 1. */
export function ReindeerMazePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ReindeerMazeVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (Lowest Score)"
      showAllOptimalTiles={false}
    />
  );
}
