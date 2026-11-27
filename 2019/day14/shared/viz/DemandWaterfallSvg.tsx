import {
  ORE_CHEMICAL,
  formatCompactBigInt,
  type DagEdgeLayout,
  type DagLayout,
  type DemandTraceFrame,
} from '../index';

interface DemandWaterfallSvgProps {
  readonly layout: DagLayout;
  readonly frame: DemandTraceFrame;
}

function getNodeColors(chemical: string, frame: DemandTraceFrame): { stroke: string; text: string } {
  if (chemical === ORE_CHEMICAL) return { stroke: 'var(--gold)', text: 'var(--gold)' };
  if (frame.activeChemical === chemical) return { stroke: 'var(--accent)', text: 'var(--accent)' };
  if (frame.resolvedDemands.has(chemical)) return { stroke: 'var(--ok)', text: 'var(--ok)' };
  if ((frame.knownNeeds.get(chemical) ?? 0n) > 0n) return { stroke: 'var(--warn)', text: 'var(--text)' };
  return { stroke: 'var(--border)', text: 'var(--muted)' };
}

function getNodeSubtitle(chemical: string, frame: DemandTraceFrame): string {
  if (chemical === ORE_CHEMICAL) {
    return `${formatCompactBigInt(frame.cumulativeOre)} ORE`;
  }
  const demand = frame.resolvedDemands.get(chemical);
  if (demand) {
    const excess = demand.leftover > 0n ? ` (+${formatCompactBigInt(demand.leftover)})` : '';
    return `${formatCompactBigInt(demand.needed)} · ${demand.batches}×${demand.batchSize}${excess}`;
  }
  const pending = frame.knownNeeds.get(chemical) ?? 0n;
  return pending > 0n ? `Need ${formatCompactBigInt(pending)}` : 'Pending';
}

function getEdgeStyle(edge: DagEdgeLayout, frame: DemandTraceFrame): { stroke: string; width: number } {
  if (edge.from === frame.activeChemical) return { stroke: 'var(--accent)', width: 2.2 };
  if (frame.resolvedDemands.has(edge.from)) return { stroke: 'var(--ok)', width: 1.5 };
  return { stroke: 'var(--border)', width: 1.1 };
}

function formatHeaderText(frame: DemandTraceFrame): string {
  if (frame.activeDemand === null) return 'Initial FUEL demand queued';
  const d = frame.activeDemand;
  return `Resolved ${d.chemical}: needed ${d.needed}, ${d.batches} batch(es) of ${d.batchSize}, leftover ${d.leftover}`;
}

/** Layered top-down SVG visualizing chemical demand propagation from FUEL to ORE. */
export function DemandWaterfallSvg({ layout, frame }: DemandWaterfallSvgProps) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{formatHeaderText(frame)}</span>
        <span className="muted">
          Reactions {frame.processedCount} / {frame.totalReactions} · ORE {frame.cumulativeOre}
        </span>
      </div>
      <svg
        viewBox={layout.viewBox}
        role="img"
        aria-label="Reaction stoichiometry demand waterfall"
        style={{ width: '100%', maxHeight: '440px', display: 'block', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}
      >
        {layout.edges.map((edge) => {
          const style = getEdgeStyle(edge, frame);
          return (
            <line
              key={`${edge.from}->${edge.to}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={style.stroke}
              strokeWidth={style.width}
            />
          );
        })}
        {layout.nodes.map((node) => {
          const colors = getNodeColors(node.chemical, frame);
          const subtitle = getNodeSubtitle(node.chemical, frame);
          return (
            <g key={node.chemical}>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={6}
                fill="var(--surface)"
                stroke={colors.stroke}
                strokeWidth={frame.activeChemical === node.chemical ? 2.2 : 1.4}
              />
              <text x={node.x + node.width / 2} y={node.y + 17} textAnchor="middle" fill={colors.text} fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace">
                {node.chemical}
              </text>
              <text x={node.x + node.width / 2} y={node.y + 34} textAnchor="middle" fill="var(--muted)" fontSize={10} fontFamily="ui-monospace, monospace">
                {subtitle}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
