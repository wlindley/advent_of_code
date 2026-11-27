import {
  projectPeelingMatrix,
  type FieldPeelingTraceFrame,
  type PeelingCellState,
  type PeelingMatrixRow,
} from '../index';

const LABEL_W = 156;
const CELL = 20;
const GAP = 3;
const TOP_PAD = 26;

function cellFill(state: PeelingCellState): string {
  if (state === 'active-lock') return 'var(--gold)';
  if (state === 'locked') return 'var(--ok)';
  if (state === 'candidate') return 'color-mix(in srgb, var(--accent) 32%, var(--surface))';
  return 'var(--surface)';
}

function cellStroke(state: PeelingCellState): string {
  if (state === 'active-lock') return 'var(--gold)';
  if (state === 'locked') return 'var(--ok)';
  return state === 'candidate' ? 'var(--accent)' : 'var(--border)';
}

function MatrixRowGroup({ row, rowIndex }: { readonly row: PeelingMatrixRow; readonly rowIndex: number }) {
  const y = TOP_PAD + rowIndex * (CELL + GAP);
  const labelColor = row.isDeparture ? 'var(--gold)' : 'var(--text)';
  return (
    <g>
      <text x={LABEL_W - 8} y={y + CELL * 0.7} textAnchor="end" fontSize={10.5} fontWeight={row.isDeparture ? 700 : 500} fill={labelColor}>
        {row.ruleName.length > 20 ? `${row.ruleName.slice(0, 19)}…` : row.ruleName}
      </text>
      {row.cells.map((state, col) => (
        <rect
          key={col}
          x={LABEL_W + col * (CELL + GAP)}
          y={y}
          width={CELL}
          height={CELL}
          rx={3}
          fill={cellFill(state)}
          stroke={cellStroke(state)}
          strokeWidth={state === 'active-lock' ? 1.8 : 1}
        />
      ))}
    </g>
  );
}

/** Rule-by-column compatibility matrix SVG highlighting degree-1 peeling locks. */
export function PeelingMatrixSvg({ frame }: { readonly frame: FieldPeelingTraceFrame }) {
  const matrix = projectPeelingMatrix(frame);
  const width = LABEL_W + matrix.fieldCount * (CELL + GAP) + 16;
  const height = TOP_PAD + matrix.rows.length * (CELL + GAP) + 12;
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Field Compatibility Matrix (Round ${frame.round} / ${frame.totalRounds})`}</strong>
        <span className="chart-sub muted">{`Discarded nearby: ${frame.discardedNearbyCount}`}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Rule to column peeling compatibility matrix">
        {Array.from({ length: matrix.fieldCount }, (_, col) => (
          <text key={col} x={LABEL_W + col * (CELL + GAP) + CELL / 2} y={16} textAnchor="middle" className="chart-axis-text">
            {col}
          </text>
        ))}
        {matrix.rows.map((row, r) => <MatrixRowGroup key={row.ruleName} row={row} rowIndex={r} />)}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />Active Lock</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />Locked</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />Candidate</span>
      </div>
    </div>
  );
}
