import type { CircuitLayout, LayoutEdge, LayoutNode, NodeStateSnapshot, Pulse, PulseTraceFrame } from '../index';

export interface PulseCircuitSvgProps {
  readonly layout: CircuitLayout;
  readonly frame: PulseTraceFrame;
}

const NODE_W = 104;
const NODE_H = 40;

function pulseColor(pulse: Pulse): string {
  return pulse === 'low' ? 'var(--accent)' : 'var(--gold)';
}

function buildEdgePath(from: LayoutNode, to: LayoutNode, edge: LayoutEdge): string {
  if (edge.isSelfLoop) {
    return `M ${from.x - 16} ${from.y - 20} C ${from.x - 28} ${from.y - 54}, ${from.x + 28} ${from.y - 54}, ${from.x + 16} ${from.y - 20}`;
  }
  if (edge.isBackEdge) {
    const midX = (from.x + to.x) / 2;
    const arcY = Math.max(from.y, to.y) + 48;
    return `M ${from.x} ${from.y + 20} Q ${midX} ${arcY} ${to.x} ${to.y + 20}`;
  }
  return `M ${from.x + 52} ${from.y} C ${from.x + 84} ${from.y}, ${to.x - 84} ${to.y}, ${to.x - 52} ${to.y}`;
}

function formatStateBadge(state: NodeStateSnapshot | undefined): { label: string; active: boolean } {
  if (!state || state.kind === 'sink') return { label: 'SINK', active: false };
  if (state.kind === 'broadcaster') return { label: 'BC', active: false };
  if (state.kind === 'flip-flop') return { label: state.isOn ? '% ON' : '% OFF', active: state.isOn };
  const pulses = Object.values(state.memory);
  const high = pulses.filter((p) => p === 'high').length;
  return { label: `& ${high}/${pulses.length}`, active: high > 0 };
}

function SvgMarkerDefs() {
  return (
    <defs>
      <marker id="d20-arrow-idle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--border)" />
      </marker>
      <marker id="d20-arrow-low" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--accent)" />
      </marker>
      <marker id="d20-arrow-high" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--gold)" />
      </marker>
    </defs>
  );
}

/** Layered left-to-right SVG circuit diagram with active pulse glow and module state badges. */
export function PulseCircuitSvg({ layout, frame }: PulseCircuitSvgProps) {
  const active = frame.activePulse;
  const ringColor = active ? pulseColor(active.pulse) : 'var(--accent)';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', padding: '0.5rem', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        style={{ width: '100%', minWidth: `${Math.min(520, layout.width)}px`, height: 'auto', display: 'block' }}
        role="img"
        aria-label="Pulse propagation circuit graph"
      >
        <SvgMarkerDefs />
        {layout.edges.map((edge, idx) => {
          const from = layout.nodeByName.get(edge.from)!;
          const to = layout.nodeByName.get(edge.to)!;
          const isActive = active !== null && active.from === edge.from && active.to === edge.to;
          const stroke = isActive ? pulseColor(active.pulse) : 'var(--border)';
          const marker = isActive ? (active.pulse === 'low' ? 'url(#d20-arrow-low)' : 'url(#d20-arrow-high)') : 'url(#d20-arrow-idle)';
          return (
            <path
              key={`${edge.from}-${edge.to}-${idx}`}
              d={buildEdgePath(from, to, edge)}
              fill="none"
              stroke={stroke}
              strokeWidth={isActive ? 3 : 1.5}
              strokeDasharray={edge.isBackEdge && !isActive ? '4 3' : undefined}
              markerEnd={marker}
            />
          );
        })}
        {layout.nodes.map((node) => {
          const state = frame.nodeStates[node.name];
          const badge = formatStateBadge(state);
          const highlighted = frame.highlightedNodes.includes(node.name);
          const x0 = node.x - NODE_W / 2;
          const y0 = node.y - NODE_H / 2;
          const border = highlighted ? ringColor : badge.active ? 'var(--ok)' : 'var(--border)';
          return (
            <g key={node.name}>
              {highlighted && (
                <rect x={x0 - 4} y={y0 - 4} width={NODE_W + 8} height={NODE_H + 8} rx={12} fill="none" stroke={ringColor} strokeWidth={2.5} opacity={0.85} />
              )}
              <rect
                x={x0}
                y={y0}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill="var(--bg)"
                stroke={border}
                strokeWidth={highlighted || badge.active ? 2 : 1.25}
                strokeDasharray={node.kind === 'sink' ? '4 3' : undefined}
              />
              <text x={node.x} y={node.y - 3} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">
                {node.name}
              </text>
              <text x={node.x} y={node.y + 12} textAnchor="middle" fontSize="10" fontWeight="600" fill={badge.active ? 'var(--ok)' : 'var(--muted)'}>
                {badge.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
