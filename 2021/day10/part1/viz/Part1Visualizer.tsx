import type { VisualizerProps } from '../../../../shared/viz';
import { SyntaxScoringVisualizer } from '../../shared/viz/SyntaxScoringVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 10 Part 1 (Syntax Scoring — corruption penalty sum). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <SyntaxScoringVisualizer rawInput={rawInput} solver={solver} />;
}
