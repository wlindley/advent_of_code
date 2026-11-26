import type { VisualizerProps } from '../../../../shared/viz';
import { KeypadConundrumVisualizer } from '../../shared/viz/KeypadConundrumVisualizer';
import { PART2_CONFIG } from '../domain';

export const PART2_EXAMPLE_INPUT = ['029A', '980A', '179A', '456A', '379A'].join('\n');

/** Interactive Part 2 Keypad Conundrum visualizer (25 directional robot layers). */
export function KeypadConundrumPart2Visualizer({ rawInput }: VisualizerProps) {
  return <KeypadConundrumVisualizer rawInput={rawInput} config={PART2_CONFIG} />;
}
