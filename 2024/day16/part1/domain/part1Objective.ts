import type { MazeAnalysis, MazeObjective } from '../../shared';

/** Part 1 objective: return the lowest reachable Reindeer Maze score. */
export const part1Objective: MazeObjective = {
  extractAnswer(analysis: MazeAnalysis): number {
    if (!analysis.isReachable) {
      throw new Error('End tile E is unreachable from start tile S');
    }
    return analysis.bestScore;
  },
};
