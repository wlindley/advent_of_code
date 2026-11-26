import type { VisualizerProps } from '../../../../shared/viz';
import { ALL_YES_POLICY } from '../../shared';
import { CustomsVisualizer } from '../../shared/viz/CustomsVisualizer';

export function CustomCustomsPart2Visualizer({ rawInput }: VisualizerProps) {
  return <CustomsVisualizer rawInput={rawInput} policy={ALL_YES_POLICY} />;
}
