import type { Turn } from '../network';
import type { WastelandTraceFrame } from '../trace';

export interface LocalDecisionHubSvgProps {
  readonly frame: WastelandTraceFrame;
}

const HUB_X = 280;
const HUB_Y = 125;
const HUB_R = 30;
const MONO = { fontFamily: 'ui-monospace, monospace' } as const;

function renderHubMarker(id: string, fill: string) {
  return (
    <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill={fill} />
    </marker>
  );
}

function renderTrailNodes(frame: WastelandTraceFrame) {
  const trail = frame.recentPath.slice(0, -1);
  if (trail.length === 0) {
    return <text x={95} y={HUB_Y + 4} textAnchor="middle" fontSize="11" fill="var(--muted)">Start (step 0)</text>;
  }
  const startY = HUB_Y - ((trail.length - 1) * 28) / 2;
  return trail.map((id, idx) => {
    const y = startY + idx * 28;
    const isPrev = idx === trail.length - 1;
    return (
      <g key={`${idx}-${id}`}>
        <rect x={52} y={y - 11} width={86} height={22} rx={6} fill={isPrev ? 'var(--bg)' : 'var(--surface)'} stroke={isPrev ? 'var(--gold)' : 'var(--border)'} strokeWidth={isPrev ? 2 : 1.2} />
        <text x={95} y={y + 4} textAnchor="middle" fontSize="11" fontWeight={isPrev ? '700' : '500'} fill="var(--text)" style={MONO}>
          {frame.network.labelOf(id)}
        </text>
      </g>
    );
  });
}

function renderIncomingArrow(frame: WastelandTraceFrame) {
  if (frame.lastTurn === undefined) return null;
  const startY = HUB_Y + ((frame.recentPath.length - 2) * 28) / 2;
  const d = `M 140 ${startY.toFixed(1)} Q 195 ${((startY + HUB_Y) / 2).toFixed(1)} ${HUB_X - HUB_R - 4} ${HUB_Y}`;
  return (
    <g>
      <path d={d} fill="none" stroke="var(--gold)" strokeWidth={2.5} markerEnd="url(#hub-gold)" />
      <text x={192} y={HUB_Y - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--gold)">{frame.lastTurn}</text>
    </g>
  );
}

function renderBranch(side: Turn, targetId: number, label: string, targetY: number, frame: WastelandTraceFrame) {
  const active = !frame.isGoal && frame.nextTurn === side;
  const stroke = active ? 'var(--accent)' : 'var(--muted)';
  const marker = active ? 'url(#hub-accent)' : 'url(#hub-muted)';
  if (targetId === frame.nodeId) {
    const dir = side === 'L' ? -1 : 1;
    const d = `M ${HUB_X} ${HUB_Y + dir * HUB_R} C ${HUB_X - 42} ${HUB_Y + dir * 78}, ${HUB_X + 42} ${HUB_Y + dir * 78}, ${HUB_X + 10} ${HUB_Y + dir * (HUB_R + 4)}`;
    return (
      <g key={side}>
        <path d={d} fill="none" stroke={stroke} strokeWidth={active ? 2.6 : 1.6} markerEnd={marker} />
        <text x={HUB_X} y={HUB_Y + dir * 68} textAnchor="middle" fontSize="11" fontWeight="700" fill={stroke}>{side} ↺ {label}</text>
      </g>
    );
  }
  const d = `M ${HUB_X + HUB_R} ${HUB_Y} Q 362 ${HUB_Y + (side === 'L' ? -24 : 24)} 418 ${targetY}`;
  return (
    <g key={side}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={active ? 2.6 : 1.6} markerEnd={marker} />
      <text x={360} y={(HUB_Y + targetY) / 2 + (side === 'L' ? -12 : 18)} textAnchor="middle" fontSize="11" fontWeight="700" fill={stroke}>{side}</text>
    </g>
  );
}

function renderTargetBox(label: string, y: number, active: boolean) {
  return (
    <g>
      <rect x={422} y={y - 16} width={96} height={32} rx={8} fill="var(--bg)" stroke={active ? 'var(--accent)' : 'var(--border)'} strokeWidth={active ? 2.2 : 1.5} />
      <text x={470} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)" style={MONO}>{label}</text>
    </g>
  );
}

function renderOutgoing(frame: WastelandTraceFrame) {
  if (frame.leftId === frame.rightId) {
    return (
      <g>
        {renderBranch('L', frame.leftId, frame.leftLabel, HUB_Y, frame)}
        {renderBranch('R', frame.rightId, frame.rightLabel, HUB_Y, frame)}
        {frame.leftId !== frame.nodeId && renderTargetBox(frame.leftLabel, HUB_Y, !frame.isGoal)}
      </g>
    );
  }
  const targets: readonly [Turn, number, string, number][] = [
    ['L', frame.leftId, frame.leftLabel, 72],
    ['R', frame.rightId, frame.rightLabel, 178],
  ];
  return targets.map(([side, tid, label, y]) => (
    <g key={side}>
      {renderBranch(side, tid, label, y, frame)}
      {tid !== frame.nodeId && renderTargetBox(label, y, !frame.isGoal && frame.nextTurn === side)}
    </g>
  ));
}

export function LocalDecisionHubSvg({ frame }: LocalDecisionHubSvgProps) {
  const hubColor = frame.isGoal ? 'var(--ok)' : 'var(--accent)';
  return (
    <section aria-label="Local decision hub" style={{ padding: '0.65rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="meta-row" style={{ marginTop: 0, marginBottom: '0.4rem', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Local Decision Hub ({frame.network.nodeCount} nodes — bounded neighborhood)</span>
        <span className="muted" style={{ fontSize: '0.76rem' }}>Trail (max 7) → Active Node → L / R Branches</span>
      </div>
      <svg viewBox="0 0 560 250" style={{ width: '100%', maxHeight: 260, display: 'block' }}>
        <defs>
          {renderHubMarker('hub-gold', 'var(--gold)')}
          {renderHubMarker('hub-accent', 'var(--accent)')}
          {renderHubMarker('hub-muted', 'var(--muted)')}
        </defs>
        {renderTrailNodes(frame)}
        {renderIncomingArrow(frame)}
        <circle cx={HUB_X} cy={HUB_Y} r={HUB_R} fill={hubColor} stroke={hubColor} strokeWidth={2} />
        <text x={HUB_X} y={HUB_Y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--surface)" style={MONO}>{frame.nodeLabel}</text>
        {renderOutgoing(frame)}
      </svg>
    </section>
  );
}
