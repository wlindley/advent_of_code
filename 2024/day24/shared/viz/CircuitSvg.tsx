import type { CircuitSnapshot, WireBit } from '../index';
import {
  type CircuitLayout,
  type LayoutEdge,
  type LayoutNode,
  SVG_HEIGHT,
  SVG_WIDTH,
  buildCircuitLayout,
} from './circuitLayout';

function edgeStroke(edge: LayoutEdge, complete: boolean): string {
  if (edge.swapped) return 'var(--gold)';
  if (edge.active) return complete ? 'var(--ok)' : 'var(--accent)';
  if (edge.bit === 1) return 'var(--ok)';
  if (edge.bit === 0) return 'var(--muted)';
  return 'var(--border)';
}

function EdgeLayer({ layout, complete }: { readonly layout: CircuitLayout; readonly complete: boolean }) {
  return (
    <g>
      {layout.edges.map((edge) => {
        const stroke = edgeStroke(edge, complete);
        const highlighted = edge.active || edge.swapped;
        return (
          <line
            key={edge.key}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke={stroke}
            strokeWidth={highlighted ? 2.4 : edge.bit === 1 ? 1.8 : 1.1}
            strokeOpacity={highlighted || edge.bit !== undefined ? 0.9 : 0.6}
            strokeDasharray={edge.bit === undefined ? '3 3' : undefined}
          />
        );
      })}
    </g>
  );
}

function nodeColors(
  node: LayoutNode,
  isActive: boolean,
  isSwapped: boolean,
  complete: boolean,
): { fill: string; stroke: string; text: string } {
  if (isSwapped) return { fill: 'var(--gold)', stroke: 'var(--gold)', text: 'var(--surface)' };
  if (isActive) {
    const c = complete ? 'var(--ok)' : 'var(--accent)';
    return { fill: c, stroke: c, text: 'var(--surface)' };
  }
  const isZ = node.id.startsWith('z');
  if (node.bit === 1) {
    return { fill: 'var(--surface)', stroke: 'var(--ok)', text: 'var(--text)' };
  }
  return {
    fill: node.kind === 'input' ? 'var(--bg)' : 'var(--surface)',
    stroke: isZ ? 'var(--accent)' : node.bit === 0 ? 'var(--muted)' : 'var(--border)',
    text: 'var(--text)',
  };
}

function bitText(bit: WireBit | undefined): string {
  return bit === undefined ? '?' : String(bit);
}

function NodeLayer({
  snapshot,
  layout,
}: {
  readonly snapshot: CircuitSnapshot;
  readonly layout: CircuitLayout;
}) {
  const activeOut = snapshot.activeGate?.out;
  const swapped = new Set(snapshot.swaps.flatMap((s) => [s.first, s.second]));
  const compact = layout.nodes.length > 28;
  const rx = compact ? 19 : 23;
  const ry = compact ? 10 : 12;

  return (
    <g>
      {layout.nodes.map((node) => {
        const isActive = node.id === activeOut;
        const isSwapped = swapped.has(node.id);
        const colors = nodeColors(node, isActive, isSwapped, snapshot.isComplete);
        return (
          <g key={node.id}>
            <rect
              x={node.x - rx}
              y={node.y - ry}
              width={rx * 2}
              height={ry * 2}
              rx={node.kind === 'input' ? 11 : 4}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={isActive || isSwapped || node.id.startsWith('z') ? 2 : 1.2}
            />
            <text
              x={node.x}
              y={node.y + (compact ? 1 : 2)}
              textAnchor="middle"
              fontSize={compact ? 8 : 9}
              fontWeight={700}
              fill={colors.text}
            >
              {node.label}:{bitText(node.bit)}
            </text>
            <text
              x={node.x}
              y={node.y + ry + 8}
              textAnchor="middle"
              fontSize={7}
              fill="var(--muted)"
            >
              {node.sublabel}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Interactive combinational logic circuit SVG (full DAG <= 40 gates; focused window > 40). */
export function CircuitSvg({ snapshot }: { readonly snapshot: CircuitSnapshot }) {
  const layout = buildCircuitLayout(snapshot);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.75rem' }}>
      <div className="meta-row" style={{ marginTop: 0, justifyContent: 'space-between', fontSize: '0.82rem' }}>
        <span>
          Gates: <code>{snapshot.settledCount} / {snapshot.totalGates}</code> · Z-bus width: <code>{snapshot.zBitCount}</code>
        </span>
        <span className="muted">
          {layout.focused
            ? `Focused window (${layout.visibleGates} / ${layout.totalGates} gates)`
            : 'Full combinational DAG'}
        </span>
      </div>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="Crossed wires logic circuit" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <EdgeLayer layout={layout} complete={snapshot.isComplete} />
        <NodeLayer snapshot={snapshot} layout={layout} />
      </svg>
      <div className="meta-row" style={{ marginBottom: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Signal 1</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Active / Z-bus</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Swapped wire</span>
      </div>
    </div>
  );
}
