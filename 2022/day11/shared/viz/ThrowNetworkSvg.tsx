import { useId, type KeyboardEvent } from 'react';
import type { KeepAwaySetup, KeepAwayTraceFrame } from '../index';

export interface ThrowNetworkSvgProps {
  readonly setup: KeepAwaySetup;
  readonly frame: KeepAwayTraceFrame;
  readonly selectedMonkey: number | null;
  readonly onSelectMonkey: (monkeyId: number) => void;
}

const W = 540;
const H = 340;
const RING_R = 114;
const NODE_R = 25;

interface Point {
  readonly x: number;
  readonly y: number;
}

function computePositions(count: number): readonly Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return { x: W / 2 + RING_R * Math.cos(angle), y: H / 2 + RING_R * Math.sin(angle) };
  });
}

function computeMaxThrow(matrix: readonly (readonly number[])[]): number {
  let max = 1;
  for (const row of matrix) {
    for (const val of row) if (val > max) max = val;
  }
  return max;
}

function buildEdgePath(from: Point, to: Point, bow: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  // Right-hand normal relative to directed chord ensures A->B and B->A bow apart.
  const sx = from.x + ux * (NODE_R + 2);
  const sy = from.y + uy * (NODE_R + 2);
  const ex = to.x - ux * (NODE_R + 5);
  const ey = to.y - uy * (NODE_R + 5);
  const cx = (sx + ex) / 2 - uy * bow;
  const cy = (sy + ey) / 2 + ux * bow;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

function ThrowEdge(props: {
  readonly fromId: number;
  readonly toId: number;
  readonly isTrue: boolean;
  readonly sameTarget: boolean;
  readonly count: number;
  readonly maxThrow: number;
  readonly selected: number | null;
  readonly positions: readonly Point[];
  readonly markerId: string;
}) {
  const { fromId, toId, isTrue, sameTarget, count, maxThrow, selected, positions, markerId } = props;
  const d = buildEdgePath(positions[fromId]!, positions[toId]!, sameTarget ? (isTrue ? 20 : 42) : 26);
  const ratio = count / maxThrow;
  const baseOpacity = count > 0 ? 0.5 + ratio * 0.45 : 0.28;
  const dimmed = selected !== null && selected !== fromId;
  return (
    <path
      d={d}
      fill="none"
      stroke={isTrue ? 'var(--ok)' : 'var(--warn)'}
      strokeWidth={count > 0 ? 1.5 + ratio * 3 : 1.1}
      strokeDasharray={count > 0 ? undefined : '4 3'}
      opacity={dimmed ? baseOpacity * 0.25 : baseOpacity}
      markerEnd={`url(#${markerId})`}
    />
  );
}

function handleNodeKey(event: KeyboardEvent<SVGGElement>, id: number, onSelect: (id: number) => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onSelect(id);
  }
}

function MonkeyNode(props: {
  readonly id: number;
  readonly pos: Point;
  readonly count: number;
  readonly queueLen: number;
  readonly rank: 0 | 1 | null;
  readonly isSelected: boolean;
  readonly onSelect: (id: number) => void;
}) {
  const { id, pos, count, queueLen, rank, isSelected, onSelect } = props;
  const haloColor = rank === 0 ? 'var(--gold)' : rank === 1 ? 'var(--accent)' : null;
  const stroke = isSelected ? 'var(--accent)' : haloColor ?? 'var(--border)';
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Monkey ${id}, ${count} inspections, ${queueLen} items`}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => handleNodeKey(e, id, onSelect)}
      style={{ cursor: 'pointer' }}
    >
      {haloColor && <circle cx={pos.x} cy={pos.y} r={NODE_R + 5} fill="none" stroke={haloColor} strokeWidth={2} opacity={0.85} />}
      <circle cx={pos.x} cy={pos.y} r={NODE_R} fill="var(--surface)" stroke={stroke} strokeWidth={isSelected ? 2.8 : 1.8} />
      <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">M{id}</text>
      <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize={10} fill="var(--muted)">{count} · [{queueLen}]</text>
    </g>
  );
}

const svgStyle = {
  width: '100%',
  maxWidth: '540px',
  height: 'auto',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  display: 'block',
} as const;

/** Circular SVG visualization of monkey throw edges and top-two inspection halos. */
export function ThrowNetworkSvg({ setup, frame, selectedMonkey, onSelectMonkey }: ThrowNetworkSvgProps) {
  const markerPrefix = useId();
  const trueMarker = `${markerPrefix}-true`;
  const falseMarker = `${markerPrefix}-false`;
  const positions = computePositions(setup.monkeyCount);
  const maxThrow = computeMaxThrow(frame.throwMatrix);
  const [top0, top1] = frame.topTwoIndices;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle} role="img" aria-label="Monkey throw network">
        <defs>
          <marker id={trueMarker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ok)" />
          </marker>
          <marker id={falseMarker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--warn)" />
          </marker>
        </defs>
        {setup.monkeys.map((m) => (
          <g key={m.id}>
            <ThrowEdge fromId={m.id} toId={m.trueTarget} isTrue sameTarget={m.trueTarget === m.falseTarget} count={frame.throwMatrix[m.id]![m.trueTarget]!} maxThrow={maxThrow} selected={selectedMonkey} positions={positions} markerId={trueMarker} />
            <ThrowEdge fromId={m.id} toId={m.falseTarget} isTrue={false} sameTarget={m.trueTarget === m.falseTarget} count={frame.throwMatrix[m.id]![m.falseTarget]!} maxThrow={maxThrow} selected={selectedMonkey} positions={positions} markerId={falseMarker} />
          </g>
        ))}
        {setup.monkeys.map((m) => (
          <MonkeyNode
            key={m.id}
            id={m.id}
            pos={positions[m.id]!}
            count={frame.counts[m.id]!}
            queueLen={frame.queues[m.id]!.length}
            rank={m.id === top0 ? 0 : m.id === top1 ? 1 : null}
            isSelected={selectedMonkey === m.id}
            onSelect={onSelectMonkey}
          />
        ))}
      </svg>
      <div className="meta-row" style={{ marginTop: '0.4rem', fontSize: '0.78rem' }}>
        <span style={{ color: 'var(--ok)', fontWeight: 600 }}>● If true</span>
        <span style={{ color: 'var(--warn)', fontWeight: 600 }}>● If false</span>
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>◯ #1 Top</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>◯ #2 Top</span>
      </div>
    </div>
  );
}
