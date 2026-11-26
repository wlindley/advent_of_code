import type { VisualizerProps } from '../../../../shared/viz';
import { ReindeerMazeVisualizer } from '../../shared/viz/ReindeerMazeVisualizer';
import { solver } from '../domain';

/** Interactive Dijkstra and optimal-seat visualizer for Reindeer Maze Part 2. */
export function ReindeerMazePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ReindeerMazeVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Best Seats)"
      showAllOptimalTiles={true}
    />
  );
}
