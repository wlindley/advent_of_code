import type { MazeAnalysis, MazeObjective } from '../../shared';

/** Part 2 objective: count every maze tile lying on at least one lowest-score path. */
export const part2Objective: MazeObjective = {
  extractAnswer(analysis: MazeAnalysis): number {
    if (!analysis.isReachable) {
      throw new Error('End tile E is unreachable from start tile S');
    }
    return analysis.optimalTileCount;
  },
};
