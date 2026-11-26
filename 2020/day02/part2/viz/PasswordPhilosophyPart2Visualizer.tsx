import type { VisualizerProps } from '../../../../shared/viz';
import { TOBOGGAN_POLICY } from '../../shared';
import { PasswordAuditVisualizer } from '../../shared/viz/PasswordAuditVisualizer';

export function PasswordPhilosophyPart2Visualizer({ rawInput }: VisualizerProps) {
  return <PasswordAuditVisualizer rawInput={rawInput} policy={TOBOGGAN_POLICY} />;
}
