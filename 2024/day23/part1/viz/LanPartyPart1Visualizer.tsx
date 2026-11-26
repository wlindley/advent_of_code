import type { VisualizerProps } from '../../../../shared/viz';
import { type LanGraph, type LanPartySnapshot, buildTriangleTrace } from '../../shared';
import { LanPartyVisualizer } from '../../shared/viz/LanPartyVisualizer';
import { PART1_PREFIX } from '../domain';

export const PART1_EXAMPLE_INPUT = [
  'kh-tc', 'qp-kh', 'de-cg', 'ka-co', 'yn-aq', 'qp-ub', 'cg-tb', 'vc-aq',
  'tb-ka', 'wh-tc', 'yn-cg', 'kh-ub', 'ta-co', 'de-co', 'tc-td', 'tb-wq',
  'wh-td', 'ta-ka', 'td-qp', 'aq-cg', 'wq-ub', 'ub-vc', 'de-ta', 'wq-aq',
  'wq-vc', 'wh-yn', 'ka-de', 'kh-ta', 'co-tc', 'wh-qp', 'tb-vc', 'td-yn',
].join('\n');

function buildPart1Trace(graph: LanGraph): readonly LanPartySnapshot[] {
  return buildTriangleTrace(graph, PART1_PREFIX);
}

function formatPart1Answer(snapshot: LanPartySnapshot): string {
  return `${snapshot.revealedCount} / ${snapshot.totalCliques}`;
}

/** Interactive Part 1 LAN Party visualizer (triangles containing a `'t*'` computer). */
export function LanPartyPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <LanPartyVisualizer
      rawInput={rawInput}
      cacheKey={`part1-${PART1_PREFIX}`}
      buildTrace={buildPart1Trace}
      summaryLabel="t* Triangles"
      formatAnswer={formatPart1Answer}
    />
  );
}
