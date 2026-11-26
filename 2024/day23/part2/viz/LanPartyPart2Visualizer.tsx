import type { VisualizerProps } from '../../../../shared/viz';
import { type LanGraph, type LanPartySnapshot, buildMaximumCliqueTrace } from '../../shared';
import { LanPartyVisualizer } from '../../shared/viz/LanPartyVisualizer';

export const PART2_EXAMPLE_INPUT = [
  'kh-tc', 'qp-kh', 'de-cg', 'ka-co', 'yn-aq', 'qp-ub', 'cg-tb', 'vc-aq',
  'tb-ka', 'wh-tc', 'yn-cg', 'kh-ub', 'ta-co', 'de-co', 'tc-td', 'tb-wq',
  'wh-td', 'ta-ka', 'td-qp', 'aq-cg', 'wq-ub', 'ub-vc', 'de-ta', 'wq-aq',
  'wq-vc', 'wh-yn', 'ka-de', 'kh-ta', 'co-tc', 'wh-qp', 'tb-vc', 'td-yn',
].join('\n');

function buildPart2Trace(graph: LanGraph): readonly LanPartySnapshot[] {
  return buildMaximumCliqueTrace(graph);
}

function formatPart2Answer(snapshot: LanPartySnapshot): string {
  return snapshot.activeClique ? snapshot.activeClique.password : 'none';
}

/** Interactive Part 2 LAN Party visualizer (maximum clique password discovery). */
export function LanPartyPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <LanPartyVisualizer
      rawInput={rawInput}
      cacheKey="part2-max-clique"
      buildTrace={buildPart2Trace}
      summaryLabel="Password"
      formatAnswer={formatPart2Answer}
    />
  );
}
