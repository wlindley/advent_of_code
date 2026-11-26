import type { OasisTraceFrame } from '../trace';

export interface PyramidSvgProps {
  readonly frame: OasisTraceFrame;
}

const CELL_W = 66;
const CELL_H = 26;
const STEP_X = 74;
const ROW_H = 38;
const PAD_X = 24;
const PAD_Y = 20;
const MAX_COLS = 7;
const MONO = { fontFamily: 'ui-monospace, monospace' } as const;

interface ChipSlot {
  readonly text: string;
  readonly fullText: string;
  readonly x: number;
  readonly isEllipsis: boolean;
  readonly isAnchor: boolean;
}

function formatChip(value: bigint): string {
  const text = String(value);
  return text.length <= 8 ? text : `${text.slice(0, 4)}…${text.slice(-3)}`;
}

function buildCenteredRow(row: readonly bigint[], rowIndex: number, isForward: boolean) {
  const startX = PAD_X + (isForward ? 0 : STEP_X) + (rowIndex * STEP_X) / 2;
  const chips: ChipSlot[] = row.map((v, i) => ({
    text: formatChip(v),
    fullText: String(v),
    x: startX + i * STEP_X,
    isEllipsis: false,
    isAnchor: isForward ? i === row.length - 1 : i === 0,
  }));
  const extrapX = isForward ? startX + row.length * STEP_X : startX - STEP_X;
  return { chips, extrapX };
}

function buildWideRow(row: readonly bigint[], isForward: boolean) {
  const truncated = row.length > MAX_COLS;
  const slice = truncated ? (isForward ? row.slice(row.length - 6) : row.slice(0, 6)) : row;
  const slots = slice.map((val, i) => ({
    val: val as bigint | null,
    anchor: isForward ? i === slice.length - 1 : i === 0,
  }));
  if (truncated) {
    const gap = { val: null, anchor: false };
    if (isForward) slots.unshift(gap);
    else slots.push(gap);
  }
  const baseStart = isForward ? PAD_X + (MAX_COLS - slots.length) * STEP_X : PAD_X + STEP_X;
  const chips: ChipSlot[] = slots.map((s, i) => ({
    text: s.val === null ? '…' : formatChip(s.val),
    fullText: s.val === null ? `${row.length - 6} inner values omitted` : String(s.val),
    x: baseStart + i * STEP_X,
    isEllipsis: s.val === null,
    isAnchor: s.anchor,
  }));
  return { chips, extrapX: isForward ? PAD_X + MAX_COLS * STEP_X : PAD_X };
}

function buildRowLayout(row: readonly bigint[], rowIndex: number, maxLen: number, isForward: boolean) {
  return maxLen <= MAX_COLS ? buildCenteredRow(row, rowIndex, isForward) : buildWideRow(row, isForward);
}

function renderConnectors(y: number, anchorX: number, extrapX: number, belowX: number, op: string) {
  return (
    <g>
      <line x1={anchorX + CELL_W / 2} y1={y + CELL_H / 2} x2={extrapX + CELL_W / 2} y2={y + CELL_H / 2} stroke="var(--accent)" strokeWidth={1.8} strokeDasharray="3 2" />
      <line x1={belowX + CELL_W / 2} y1={y + ROW_H} x2={extrapX + CELL_W / 2} y2={y + CELL_H} stroke="var(--gold)" strokeWidth={1.8} />
      <text x={(anchorX + extrapX + CELL_W) / 2} y={y + 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--accent)">{op}</text>
    </g>
  );
}

function renderExtrapCell(
  frame: OasisTraceFrame,
  rowIndex: number,
  extrapX: number,
  y: number,
  anchorX: number,
  belowX: number | null,
) {
  const fromLayer = frame.extrapolatedFromLayer;
  if (fromLayer === null || rowIndex < fromLayer) return null;
  const value = frame.extrapolation.valuesByLayer[rowIndex]!;
  const isCurrent = rowIndex === frame.activeLayer;
  const isFinal = rowIndex === 0 && frame.isHistoryComplete;
  const stroke = isFinal ? 'var(--ok)' : isCurrent ? 'var(--gold)' : 'var(--ok)';
  return (
    <g>
      {frame.phase === 'ascend' && isCurrent && belowX !== null &&
        renderConnectors(y, anchorX, extrapX, belowX, frame.strategy.operatorSymbol)}
      <rect x={extrapX} y={y} width={CELL_W} height={CELL_H} rx={6} fill="var(--surface)" stroke={stroke} strokeWidth={isCurrent || isFinal ? 2.4 : 1.6} />
      <text x={extrapX + CELL_W / 2} y={y + 17} textAnchor="middle" fontSize="12" fontWeight="700" fill={stroke} style={MONO}>
        <title>{String(value)}</title>
        {formatChip(value)}
      </text>
    </g>
  );
}

function renderPyramidRow(frame: OasisTraceFrame, row: readonly bigint[], rowIndex: number) {
  const maxLen = frame.pyramid.length;
  const isForward = frame.strategy.direction === 'forward';
  const y = PAD_Y + rowIndex * ROW_H;
  const { chips, extrapX } = buildRowLayout(row, rowIndex, maxLen, isForward);
  const anchorChip = chips.find((c) => c.isAnchor)!;
  const belowRow = frame.pyramid.layers[rowIndex + 1];
  const belowX = belowRow ? buildRowLayout(belowRow, rowIndex + 1, maxLen, isForward).extrapX : null;
  const isActive = rowIndex === frame.activeLayer;

  return (
    <g key={rowIndex}>
      {chips.map((chip, idx) => {
        const highlight =
          frame.phase === 'baseline' && isActive
            ? 'var(--gold)'
            : isActive && (frame.phase === 'descend' || (frame.phase === 'ascend' && chip.isAnchor))
              ? 'var(--accent)'
              : 'var(--border)';
        return (
          <g key={idx}>
            <rect x={chip.x} y={y} width={CELL_W} height={CELL_H} rx={6} fill={chip.isEllipsis ? 'var(--bg)' : 'var(--surface)'} stroke={highlight} strokeWidth={highlight === 'var(--border)' ? 1.2 : 2} />
            <text x={chip.x + CELL_W / 2} y={y + 17} textAnchor="middle" fontSize="12" fontWeight={chip.isAnchor ? '700' : '500'} fill={chip.isEllipsis ? 'var(--muted)' : 'var(--text)'} style={MONO}>
              <title>{chip.fullText}</title>
              {chip.text}
            </text>
          </g>
        );
      })}
      {renderExtrapCell(frame, rowIndex, extrapX, y, anchorChip.x, belowX)}
    </g>
  );
}

export function PyramidSvg({ frame }: PyramidSvgProps) {
  const cols = Math.min(frame.pyramid.length, MAX_COLS) + 1;
  const width = PAD_X * 2 + cols * STEP_X - (STEP_X - CELL_W);
  const height = PAD_Y * 2 + frame.pyramid.depth * ROW_H;
  const rows = frame.pyramid.layers.slice(0, frame.revealedDepth);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', maxHeight: '420px', display: 'block' }}
      role="img"
      aria-label="OASIS difference pyramid extrapolation"
    >
      {rows.map((row, rowIndex) => renderPyramidRow(frame, row, rowIndex))}
    </svg>
  );
}
