import type { VisualizerProps } from '../../../../shared/viz';
import { PRESENCE_POLICY } from '../../shared';
import { PassportScanVisualizer } from '../../shared/viz/PassportScanVisualizer';

export function PassportProcessingPart1Visualizer({ rawInput }: VisualizerProps) {
  return <PassportScanVisualizer rawInput={rawInput} policy={PRESENCE_POLICY} />;
}
