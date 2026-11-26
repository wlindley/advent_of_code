import type { Crate } from '../model';
import type { CraneTraceFrame } from '../simulator';

const SVG_W = 640;
const SVG_H = 320;
const BAY_LEFT = 24;
const BAY_WIDTH = 592;
const BAY_TOP = 66;
const BAY_BOTTOM = 294;

interface GantryOverlayProps {
  readonly frame: CraneTraceFrame;
  readonly stackCount: number;
  readonly accentColor: string;
}

interface CrateRectProps {
  readonly crate: Crate;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly isNew: boolean;
  readonly accentColor: string;
}

interface CrateColumnProps {
  readonly stack: readonly Crate[];
  readonly colIdx: number;
  readonly stackCount: number;
  readonly pitchY: number;
  readonly crateW: number;
  readonly crateH: number;
  readonly targetCol: number;
  readonly placedCount: number;
  readonly accentColor: string;
}

function columnCenterX(colIdx: number, stackCount: number): number {
  return BAY_LEFT + (BAY_WIDTH / stackCount) * (colIdx + 0.5);
}

function crateTint(label: string): string {
  const hue = ((label.charCodeAt(0) - 65) * 47) % 360;
  return `hsl(${hue} 48% 92%)`;
}

function GantryOverlay({ frame, stackCount, accentColor }: GantryOverlayProps) {
  const move = frame.appliedMove;
  if (!move) {
    return (
      <g>
        <line x1={BAY_LEFT} y1={22} x2={BAY_LEFT + BAY_WIDTH} y2={22} stroke="var(--border)" strokeWidth={3} strokeLinecap="round" />
        <text x={SVG_W / 2} y={16} fontSize={11} textAnchor="middle" fill="var(--muted)">Gantry idle</text>
      </g>
    );
  }
  const fromX = columnCenterX(move.from - 1, stackCount);
  const toX = columnCenterX(move.to - 1, stackCount);
  const midX = (fromX + toX) / 2;
  return (
    <g>
      <line x1={BAY_LEFT} y1={22} x2={BAY_LEFT + BAY_WIDTH} y2={22} stroke="var(--border)" strokeWidth={3} strokeLinecap="round" />
      <path d={`M ${fromX} 36 Q ${midX} 6 ${toX} 36`} fill="none" stroke={accentColor} strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={fromX} cy={36} r={3.5} fill="var(--surface)" stroke={accentColor} strokeWidth={2} />
      <circle cx={toX} cy={36} r={4.5} fill={accentColor} />
      <rect x={midX - 18} y={10} width={36} height={18} rx={9} fill="var(--surface)" stroke={accentColor} strokeWidth={1.5} />
      <text x={midX} y={23} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--text)">{`×${move.count}`}</text>
    </g>
  );
}

function CrateRect({ crate, x, y, w, h, isNew, accentColor }: CrateRectProps) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx={h >= 8 ? 3 : 1}
        fill={crateTint(crate.label)} stroke={isNew ? accentColor : 'var(--border)'} strokeWidth={isNew ? 2 : 1}
      />
      {h >= 13 && (
        <text x={x + w / 2} y={y + h / 2 + 4} fontSize={Math.min(12, h - 4)} fontWeight={700} textAnchor="middle" fill="var(--text)">
          {crate.label}
        </text>
      )}
    </g>
  );
}

function CrateColumn({ stack, colIdx, stackCount, pitchY, crateW, crateH, targetCol, placedCount, accentColor }: CrateColumnProps) {
  const cx = columnCenterX(colIdx, stackCount);
  const topY = BAY_BOTTOM - stack.length * pitchY;
  const topLabel = stack.at(-1)?.label ?? '—';
  const isTarget = colIdx === targetCol;
  const calloutFill = stack.length === 0 ? 'var(--muted)' : isTarget ? accentColor : 'var(--text)';
  return (
    <g>
      {stack.map((crate, rowIdx) => (
        <CrateRect
          key={rowIdx} crate={crate} x={cx - crateW / 2} y={BAY_BOTTOM - (rowIdx + 1) * pitchY}
          w={crateW} h={crateH} isNew={isTarget && rowIdx >= stack.length - placedCount} accentColor={accentColor}
        />
      ))}
      <text x={cx} y={topY - 6} fontSize={12} fontWeight={700} textAnchor="middle" fill={calloutFill}>{topLabel}</text>
      <text x={cx} y={311} fontSize={12} fontWeight={600} textAnchor="middle" fill="var(--muted)">{colIdx + 1}</text>
    </g>
  );
}

export function CraneBaySvg({ frame, accentColor }: { readonly frame: CraneTraceFrame; readonly accentColor: string }) {
  const stackCount = frame.stacks.length;
  const crateW = Math.min(54, Math.max(14, (BAY_WIDTH / stackCount) * 0.72));
  const pitchY = Math.min(28, (BAY_BOTTOM - BAY_TOP) / Math.max(1, frame.globalPeakHeight));
  const crateH = Math.max(2, pitchY - (pitchY > 8 ? 2 : pitchY > 4 ? 1 : 0));
  const targetCol = frame.appliedMove ? frame.appliedMove.to - 1 : -1;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', margin: '0.5rem 0' }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Cargo crane stacks">
        <GantryOverlay frame={frame} stackCount={stackCount} accentColor={accentColor} />
        <line x1={BAY_LEFT - 6} y1={BAY_BOTTOM} x2={BAY_LEFT + BAY_WIDTH + 6} y2={BAY_BOTTOM} stroke="var(--text)" strokeWidth={1.5} />
        {frame.stacks.map((stack, colIdx) => (
          <CrateColumn
            key={colIdx} stack={stack} colIdx={colIdx} stackCount={stackCount} pitchY={pitchY}
            crateW={crateW} crateH={crateH} targetCol={targetCol} placedCount={frame.placedCrates.length} accentColor={accentColor}
          />
        ))}
      </svg>
    </div>
  );
}
