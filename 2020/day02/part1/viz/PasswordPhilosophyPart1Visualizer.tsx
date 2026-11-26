import type { VisualizerProps } from '../../../../shared/viz';
import { SLED_RENTAL_POLICY } from '../../shared';
import { PasswordAuditVisualizer } from '../../shared/viz/PasswordAuditVisualizer';

export function PasswordPhilosophyPart1Visualizer({ rawInput }: VisualizerProps) {
  return <PasswordAuditVisualizer rawInput={rawInput} policy={SLED_RENTAL_POLICY} />;
}
