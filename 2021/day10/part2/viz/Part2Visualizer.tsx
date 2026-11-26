import type { VisualizerProps } from '../../../../shared/viz';
import { SyntaxScoringVisualizer } from '../../shared/viz/SyntaxScoringVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 10 Part 2 (Syntax Scoring — autocomplete median). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <SyntaxScoringVisualizer rawInput={rawInput} solver={solver} />;
}
