import type { VisualizerProps } from '../../../../shared/viz';
import { HIGHEST_SEAT_POLICY } from '../../shared';
import { BoardingVisualizer } from '../../shared/viz/BoardingVisualizer';

export function BinaryBoardingPart1Visualizer({ rawInput }: VisualizerProps) {
  return <BoardingVisualizer rawInput={rawInput} policy={HIGHEST_SEAT_POLICY} />;
}
