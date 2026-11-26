import type { VisualizerProps } from '../../../../shared/viz';
import { MISSING_INTERIOR_SEAT_POLICY } from '../../shared';
import { BoardingVisualizer } from '../../shared/viz/BoardingVisualizer';

export function BinaryBoardingPart2Visualizer({ rawInput }: VisualizerProps) {
  return <BoardingVisualizer rawInput={rawInput} policy={MISSING_INTERIOR_SEAT_POLICY} />;
}
