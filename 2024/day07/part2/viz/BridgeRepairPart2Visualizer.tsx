import type { VisualizerProps } from '../../../../shared/viz';
import { PART2_OPERATORS } from '../domain';
import { BridgeRepairVisualizer } from '../../shared/viz/BridgeRepairVisualizer';

export function BridgeRepairPart2Visualizer({ rawInput }: VisualizerProps) {
  return <BridgeRepairVisualizer rawInput={rawInput} operators={PART2_OPERATORS} />;
}
