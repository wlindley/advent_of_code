import { bigintLog2 } from '../../../../shared/core';
import type { HotSpringsTraceFrame, SpringRecord } from '../index';

export interface DpHeatmapSvgProps {
  readonly record: SpringRecord;
  readonly table: readonly (readonly bigint[])[];
  readonly frames: readonly HotSpringsTraceFrame[];
  readonly activeFrameIndex: number;
  readonly onSelectFrame: (index: number) => void;
}

function scoreBigInt(val: bigint): number {
  return val > 0n ? bigintLog2(val) + 1 : 0;
}

function maxBigIntInTable(table: readonly (readonly bigint[])[]): bigint {
  let maxVal = 0n;
  for (const row of table) {
    for (const val of row) if (val > maxVal) maxVal = val;
  }
  return maxVal;
}

function maxFrameArrangements(frames: readonly HotSpringsTraceFrame[]): bigint {
  let maxVal = 0n;
  for (const frame of frames) {
    if (frame.arrangements > maxVal) maxVal = frame.arrangements;
  }
  return maxVal;
}

function cellFill(val: bigint, maxScore: number, isOrigin: boolean): string {
  if (val === 0n) return 'var(--bg)';
  const ratio = Math.min(1, scoreBigInt(val) / maxScore);
  if (isOrigin) return `rgba(154, 103, 0, ${0.24 + ratio * 0.48})`;
  return `rgba(9, 105, 218, ${0.14 + ratio * 0.72})`;
}

function DpMatrixRow({
  row,
  rowIndex,
  rowLabel,
  cell,
  labelW,
  headerH,
  maxScore,
}: {
  readonly row: readonly bigint[];
  readonly rowIndex: number;
  readonly rowLabel: string;
  readonly cell: number;
  readonly labelW: number;
  readonly headerH: number;
  readonly maxScore: number;
}) {
  const y = headerH + rowIndex * cell;
  const fontSize = Math.min(10, Math.max(7, cell - 2));
  return (
    <g>
      <text
        x={labelW - 4}
        y={y + cell * 0.72}
        textAnchor="end"
        fontSize={fontSize}
        fontFamily="ui-monospace, monospace"
        fill="var(--text)"
      >
        {rowLabel}
      </text>
      {row.map((val, c) => {
        const isOrigin = rowIndex === 0 && c === 0;
        return (
          <rect
            key={c}
            x={labelW + c * cell + 0.5}
            y={y + 0.5}
            width={Math.max(1, cell - 1)}
            height={Math.max(1, cell - 1)}
            rx={2}
            fill={cellFill(val, maxScore, isOrigin)}
            stroke={isOrigin ? 'var(--gold)' : 'var(--border)'}
            strokeWidth={isOrigin ? 1.8 : 0.6}
          >
            <title>{`dp[${rowIndex}][${c}] = ${val.toString()}`}</title>
          </rect>
        );
      })}
    </g>
  );
}

function DpMatrixSvg({
  record,
  table,
}: {
  readonly record: SpringRecord;
  readonly table: readonly (readonly bigint[])[];
}) {
  const cols = record.length + 1;
  const maxVal = maxBigIntInTable(table);
  const maxScore = Math.max(1, maxVal > 0n ? bigintLog2(maxVal) + 1 : 1);
  const cell = Math.max(7, Math.min(22, Math.floor(660 / cols)));
  const labelW = 42;
  const headerH = 18;
  const width = labelW + cols * cell + 8;
  const height = headerH + table.length * cell + 8;
  const fontSize = Math.min(11, Math.max(7, cell - 2));
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: `${Math.max(width, 420)}px`, display: 'block' }} role="img" aria-label={`Suffix DP heatmap (${table.length} by ${cols})`}>
        {Array.from({ length: cols }, (_, c) => (
          <text key={c} x={labelW + c * cell + cell / 2} y={12} textAnchor="middle" fontSize={fontSize} fontFamily="ui-monospace, monospace" fill="var(--muted)">
            {c < record.length ? record.pattern[c] : '∅'}
          </text>
        ))}
        {table.map((row, g) => (
          <DpMatrixRow key={g} row={row} rowIndex={g} rowLabel={g < record.groupCount ? `g${g}:${record.groups[g]}` : '∅'} cell={cell} labelW={labelW} headerH={headerH} maxScore={maxScore} />
        ))}
      </svg>
    </div>
  );
}

function SampledRowsStrip({
  frames,
  activeFrameIndex,
  onSelectFrame,
}: {
  readonly frames: readonly HotSpringsTraceFrame[];
  readonly activeFrameIndex: number;
  readonly onSelectFrame: (index: number) => void;
}) {
  const maxVal = maxFrameArrangements(frames);
  const maxScore = Math.max(1, maxVal > 0n ? bigintLog2(maxVal) + 1 : 1);
  const barH = 42;
  const barW = Math.max(4, Math.min(18, Math.floor(680 / Math.max(1, frames.length))));
  const width = Math.max(200, frames.length * barW + 4);
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${barH + 8}`} style={{ maxWidth: '720px', display: 'block' }} role="img" aria-label="Sampled row arrangement counts (log2 scale)">
        {frames.map((frame, idx) => {
          const h = Math.max(3, Math.round((scoreBigInt(frame.arrangements) / maxScore) * (barH - 4)));
          const active = idx === activeFrameIndex;
          return (
            <rect key={frame.rowIndex} x={2 + idx * barW + 0.5} y={barH - h} width={Math.max(2, barW - 1.5)} height={h} rx={1.5} fill={active ? 'var(--gold)' : 'var(--accent)'} opacity={active ? 1 : 0.55} style={{ cursor: 'pointer' }} onClick={() => onSelectFrame(idx)}>
              <title>{`Row #${frame.rowIndex + 1}: ${frame.arrangements.toString()} ways`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

/** Suffix-DP heatmap for the active spring row paired with a clickable sampled-row log2 bar strip. */
export function DpHeatmapSvg({ record, table, frames, activeFrameIndex, onSelectFrame }: DpHeatmapSvgProps) {
  return (
    <div className="stack">
      <div>
        <span className="eyebrow">Suffix-DP Table (gold = dp[0][0] answer, log2 intensity)</span>
        {record.length <= 110 ? (
          <DpMatrixSvg record={record} table={table} />
        ) : (
          <p className="muted" style={{ margin: '0.35rem 0', fontSize: '0.84rem' }}>
            Pattern length {record.length} exceeds 110-column heatmap cap; showing sampled row profile below.
          </p>
        )}
      </div>
      <div>
        <span className="eyebrow">Sampled Rows (click bar to inspect row, log2 scale)</span>
        <SampledRowsStrip frames={frames} activeFrameIndex={activeFrameIndex} onSelectFrame={onSelectFrame} />
      </div>
    </div>
  );
}
