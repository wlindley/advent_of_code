import { projectTurnTimeline, type MemoryGameTraceFrame, type TimelineArc, type TimelineTile } from '../index';

const SVG_W = 800;
const SVG_H = 180;
const TILE_W = 44;
const GAP = 4;
const LEFT = 18;
const TILE_Y = 104;
const TILE_H = 56;

function tileCenterX(index: number): number {
  return LEFT + index * (TILE_W + GAP) + TILE_W / 2;
}

function tileAccent(tile: TimelineTile): string {
  if (tile.isCurrent) return 'var(--ok)';
  if (tile.isConsidered) return 'var(--accent)';
  return tile.isPreviousMatch ? 'var(--gold)' : 'var(--border)';
}

function tileFill(tile: TimelineTile): string {
  const accent = tileAccent(tile);
  return accent === 'var(--border)' ? 'var(--surface)' : `color-mix(in srgb, ${accent} 13%, var(--surface))`;
}

function ArcOverlay({ arc }: { readonly arc: TimelineArc }) {
  if (arc.targetIndex < 0) return null;
  const targetX = tileCenterX(arc.targetIndex);
  if (arc.mode === 'in-window' && arc.previousIndex !== null && arc.consideredIndex !== null) {
    const [x1, x2] = [tileCenterX(arc.previousIndex), tileCenterX(arc.consideredIndex)];
    const midX = (x1 + x2) / 2;
    const apexY = Math.max(20, TILE_Y - 26 - Math.abs(x2 - x1) * 0.14);
    return (
      <g>
        <path d={`M ${x1} ${TILE_Y} Q ${midX} ${apexY} ${x2} ${TILE_Y}`} fill="none" stroke="var(--gold)" strokeWidth={2.2} />
        <path d={`M ${x2} ${TILE_Y} Q ${(x2 + targetX) / 2} ${TILE_Y - 26} ${targetX} ${TILE_Y}`} fill="none" stroke="var(--ok)" strokeWidth={2} />
        <text x={midX} y={Math.max(15, (apexY + TILE_Y) / 2 - 4)} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--gold)">{arc.label}</text>
      </g>
    );
  }
  if (arc.consideredIndex === null) {
    return <text x={targetX} y={84} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--accent)">{arc.label}</text>;
  }
  const x2 = tileCenterX(arc.consideredIndex);
  if (arc.mode === 'off-window') {
    return (
      <g>
        <path d={`M 10 ${TILE_Y - 56} Q ${x2 * 0.45} 20 ${x2} ${TILE_Y}`} fill="none" stroke="var(--gold)" strokeWidth={2} strokeDasharray="5 3" />
        <text x={Math.max(120, x2 * 0.48)} y={26} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--gold)">{arc.label}</text>
      </g>
    );
  }
  const midX = (x2 + targetX) / 2;
  return (
    <g>
      <path d={`M ${x2} ${TILE_Y} Q ${midX} 54 ${targetX} ${TILE_Y}`} fill="none" stroke="var(--warn)" strokeWidth={2} strokeDasharray="4 3" />
      <text x={midX} y={62} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--warn)">{arc.label}</text>
    </g>
  );
}

function TurnTileNode({ tile }: { readonly tile: TimelineTile }) {
  const x = LEFT + tile.index * (TILE_W + GAP);
  const stroke = tileAccent(tile);
  const tag = tile.origin === 'seed' ? 'SEED' : tile.origin === 'novel' ? 'NEW' : 'AGE';
  return (
    <g>
      <rect x={x} y={TILE_Y} width={TILE_W} height={TILE_H} rx={6} fill={tileFill(tile)} stroke={stroke} strokeWidth={stroke === 'var(--border)' ? 1 : 2} />
      <text x={x + TILE_W / 2} y={TILE_Y + 14} textAnchor="middle" fontSize={9.5} fill="var(--muted)">{`T${tile.turn}`}</text>
      <text x={x + TILE_W / 2} y={TILE_Y + 34} textAnchor="middle" fontSize={13} fontWeight={700} fill={tile.isCurrent ? 'var(--ok)' : 'var(--text)'}>{tile.spoken}</text>
      <text x={x + TILE_W / 2} y={TILE_Y + 49} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--muted)">{tag}</text>
    </g>
  );
}

/** Interactive 16-turn sliding-window timeline with lookback Bézier arcs. */
export function TurnArcTimelineSvg({ frame }: { readonly frame: MemoryGameTraceFrame }) {
  const projection = projectTurnTimeline(frame);
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Sliding Window (Last ${projection.tiles.length} Turns)`}</strong>
        <span className="chart-sub muted">{projection.formula}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Memory game recent turns lookback timeline">
        <ArcOverlay arc={projection.arc} />
        {projection.tiles.map((tile) => <TurnTileNode key={tile.turn} tile={tile} />)}
      </svg>
    </div>
  );
}
