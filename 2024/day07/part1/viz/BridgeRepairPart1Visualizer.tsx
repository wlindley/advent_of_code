import type { VisualizerProps } from '../../../../shared/viz';
import { PART1_OPERATORS } from '../../shared';
import { BridgeRepairVisualizer } from '../../shared/viz/BridgeRepairVisualizer';

export function BridgeRepairPart1Visualizer({ rawInput }: VisualizerProps) {
  return <BridgeRepairVisualizer rawInput={rawInput} operators={PART1_OPERATORS} />;
}
