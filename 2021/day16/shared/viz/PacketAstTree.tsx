import type { CSSProperties } from 'react';
import { OPERATOR_SPECS, type IndexedPacketNode, type PacketTraceFrame } from '../index';

const MAX_VISIBLE_ROWS = 120;

export interface PacketAstTreeProps {
  readonly frame: PacketTraceFrame;
}

function computeNodeWindow(total: number, activeId: number): readonly [number, number] {
  if (total <= MAX_VISIBLE_ROWS) return [0, total];
  const half = MAX_VISIBLE_ROWS >> 1;
  const start = Math.max(0, Math.min(total - MAX_VISIBLE_ROWS, activeId - half));
  return [start, start + MAX_VISIBLE_ROWS];
}

function describeNode(node: IndexedPacketNode): string {
  if (node.packet.kind === 'literal') return `LIT ${node.packet.value.toString()}`;
  const spec = OPERATOR_SPECS[node.packet.typeId];
  return `${spec.name.toUpperCase()} (${spec.symbol}, I=${node.packet.lengthTypeId}, ${node.packet.children.length} ch)`;
}

function buildRowStyle(depth: number, isActive: boolean, isReduced: boolean): CSSProperties {
  const borderColor = isActive ? 'var(--accent)' : isReduced ? 'var(--ok)' : 'var(--border)';
  return {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.35rem 0.6rem',
    marginLeft: `${Math.min(depth, 10) * 14}px`,
    borderRadius: '6px',
    border: `${isActive ? 2 : 1}px solid ${borderColor}`,
    background: isActive ? 'rgba(9, 105, 218, 0.08)' : 'var(--surface)',
    fontSize: '0.82rem',
  };
}

function PacketAstRow({ node, frame }: { readonly node: IndexedPacketNode; readonly frame: PacketTraceFrame }) {
  const isActive = node.id === frame.activeNodeId;
  const isReduced = frame.isNodeReduced(node.id);
  const status = isReduced ? 'reduced' : frame.isNodeDecoded(node.id) ? 'decoded' : 'queued';

  return (
    <div style={buildRowStyle(node.depth, isActive, isReduced)}>
      <span style={{ color: 'var(--text)', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        <strong>#{node.id}</strong> V{node.packet.version} T{node.packet.typeId} · {describeNode(node)}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
        <span className="muted" style={{ fontSize: '0.75rem' }}>
          [{node.packet.span.startBit}..{node.packet.span.endBit}) · {status}
        </span>
        {isReduced && (
          <strong style={{ color: 'var(--gold)', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            = {frame.snapshot.nodeValues[node.id]!.toString()}
          </strong>
        )}
      </span>
    </div>
  );
}

/** Windowed packet AST hierarchy highlighting decode discovery and post-order reduction. */
export function PacketAstTree({ frame }: PacketAstTreeProps) {
  const { nodes } = frame.snapshot;
  const [startIdx, endIdx] = computeNodeWindow(nodes.length, frame.activeNodeId);
  const visibleNodes = nodes.slice(startIdx, endIdx);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: '0 0 0.5rem', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
          Packet AST ({startIdx}..{endIdx - 1} of {nodes.length} packets)
        </strong>
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          Max depth {frame.snapshot.transmission.root.maxDepth}
        </span>
      </div>
      <div className="stack" style={{ gap: '0.35rem', maxHeight: '420px', overflowY: 'auto' }}>
        {visibleNodes.map((node) => (
          <PacketAstRow key={node.id} node={node} frame={frame} />
        ))}
      </div>
    </div>
  );
}
