import type { VisualizerProps } from '../../../../shared/viz';
import { KeypadConundrumVisualizer } from '../../shared/viz/KeypadConundrumVisualizer';
import { PART1_CONFIG } from '../domain';

export const PART1_EXAMPLE_INPUT = ['029A', '980A', '179A', '456A', '379A'].join('\n');

/** Interactive Part 1 Keypad Conundrum visualizer (2 directional robot layers). */
export function KeypadConundrumPart1Visualizer({ rawInput }: VisualizerProps) {
  return <KeypadConundrumVisualizer rawInput={rawInput} config={PART1_CONFIG} />;
}
