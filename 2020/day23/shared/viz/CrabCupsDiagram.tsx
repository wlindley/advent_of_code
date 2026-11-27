import {
  projectCrabCups,
  RING_CX,
  RING_CY,
  RING_R,
  SVG_HEIGHT,
  SVG_WIDTH,
  type CrabCupsProjection,
  type CrabCupsTraceFrame,
  type CupRole,
  type RibbonChipProjection,
  type RingNodeProjection,
} from '../index';

interface RoleStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly width: number;
}

function roleStyle(role: CupRole, isAnchorOne: boolean): RoleStyle {
  if (role === 'current') return { fill: 'color-mix(in srgb, var(--accent) 16%, var(--surface))', stroke: 'var(--accent)', width: 2.5 };
  if (role === 'destination') return { fill: 'color-mix(in srgb, var(--ok) 16%, var(--surface))', stroke: 'var(--ok)', width: 2.5 };
  if (role === 'picked') return { fill: 'color-mix(in srgb, var(--gold) 18%, var(--surface))', stroke: 'var(--gold)', width: 2 };
  return { fill: 'var(--surface)', stroke: isAnchorOne ? 'var(--text)' : 'var(--border)', width: isAnchorOne ? 2 : 1.25 };
}

function RingNode({ node }: { readonly node: RingNodeProjection }) {
  const style = roleStyle(node.role, node.isAnchorOne);
  return (
    <g>
      <circle cx={node.x} cy={node.y} r={node.isAnchorOne ? 21 : 18} fill={style.fill} stroke={style.stroke} strokeWidth={style.width} />
      <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">{node.cup}</text>
      {node.isAnchorOne && (
        <text x={node.x} y={node.y - 25} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--muted)">Anchor #1</text>
      )}
    </g>
  );
}

function MoveInspector({ proj, x, y, width, height }: {
  readonly proj: CrabCupsProjection; readonly x: number; readonly y: number; readonly width: number; readonly height: number;
}) {
  const m = proj.lastMove;
  const answerLine = proj.mode === 'ring' ? `After 1: ${proj.labelsAfterOne}` : `Star Product: ${proj.productAfterOne}`;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} fill="var(--bg)" stroke="var(--border)" />
      <text x={x + 16} y={y + 26} fontSize={12} fontWeight={700} fill="var(--accent)">
        {`Move ${proj.move} / ${proj.totalMoves} · Current ${proj.currentCup}`}
      </text>
      <text x={x + 16} y={y + 50} fontSize={11.5} fill="var(--text)">
        {m ? `Source Cup: ${m.sourceCup} -> Dest: ${m.destination}${proj.didWrap ? ' (wrapped)' : ''}` : 'Initial cup circle (before move 1)'}
      </text>
      <text x={x + 16} y={y + 72} fontSize={11.5} fill="var(--gold)" fontWeight={600}>
        {m ? `Picked Up (3): ${m.pickedUp.join(' -> ')}` : 'Picked Up (3): —'}
      </text>
      <text x={x + 16} y={y + height - 18} fontSize={12.5} fontWeight={700} fill={proj.isFinal ? 'var(--ok)' : 'var(--text)'}>
        {answerLine}
      </text>
    </g>
  );
}

function RingView({ proj }: { readonly proj: Extract<CrabCupsProjection, { mode: 'ring' }> }) {
  return (
    <g>
      <defs>
        <marker id="cup-splice-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
        </marker>
      </defs>
      <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke="var(--border)" strokeDasharray="3 4" />
      {proj.spliceArc && (
        <path d={proj.spliceArc.path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#cup-splice-arrow)" />
      )}
      {proj.nodes.map((node) => <RingNode key={node.cup} node={node} />)}
      <MoveInspector proj={proj} x={418} y={48} width={316} height={240} />
    </g>
  );
}

function RibbonRow({ title, chips, y, summary }: {
  readonly title: string; readonly chips: readonly RibbonChipProjection[]; readonly y: number; readonly summary: string;
}) {
  return (
    <g>
      <text x={24} y={y} fontSize={11.5} fontWeight={700} fill="var(--text)">{title}</text>
      <text x={736} y={y} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--muted)">{summary}</text>
      {chips.map((chip, idx) => {
        const cx = 24 + idx * 60;
        const style = roleStyle(chip.role, chip.isAnchorOne);
        return (
          <g key={`${title}-${chip.cup}`}>
            <rect x={cx} y={y + 10} width={52} height={36} rx={6} fill={style.fill} stroke={chip.isStarCup ? 'var(--ok)' : style.stroke} strokeWidth={chip.isStarCup ? 2 : style.width} />
            <text x={cx + 26} y={y + 32} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">{chip.cup}</text>
          </g>
        );
      })}
    </g>
  );
}

function RibbonView({ proj }: { readonly proj: Extract<CrabCupsProjection, { mode: 'ribbon' }> }) {
  return (
    <g>
      <RibbonRow title="Anchor Window (from Cup 1)" chips={proj.anchorRibbon} y={32} summary={`Product: ${proj.productAfterOne}`} />
      <RibbonRow title={`Current Window (from Cup ${proj.currentCup})`} chips={proj.currentRibbon} y={118} summary={`${proj.cupCount.toLocaleString()} total cups`} />
      <MoveInspector proj={proj} x={24} y={206} width={712} height={114} />
    </g>
  );
}

/** Light-mode SVG diagram rendering either a circular cup ring or dual local-window ribbons. */
export function CrabCupsDiagram({ frame }: { readonly frame: CrabCupsTraceFrame }) {
  const proj = projectCrabCups(frame);
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Move ${proj.move} / ${proj.totalMoves} · Current Cup ${proj.currentCup}`}</strong>
        <span className="chart-sub muted">{`${proj.cupCount.toLocaleString()} cups · ${proj.mode === 'ring' ? 'Full Ring' : 'Window Ribbon'}`}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="Crab Cups circular ring diagram">
        {proj.mode === 'ring' ? <RingView proj={proj} /> : <RibbonView proj={proj} />}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />Current Cup / Splice</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />Picked Up (3)</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />Destination / Star Cups</span>
      </div>
    </div>
  );
}
