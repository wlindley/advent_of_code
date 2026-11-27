import {
  projectPeelingMatrix,
  type PeelingCellState,
  type PeelingMatrixRow,
  type PeelingTraceFrame,
} from '../index';

const LABEL_W = 120;
const CELL = 26;
const GAP = 4;
const TOP_PAD = 74;

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
  const label = row.allergen.length > 14 ? `${row.allergen.slice(0, 13)}…` : row.allergen;
  return (
    <g>
      <text x={LABEL_W - 8} y={y + CELL * 0.68} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--text)">
        {label}
      </text>
      {row.cells.map((state, col) => (
        <rect
          key={col}
          x={LABEL_W + col * (CELL + GAP)}
          y={y}
          width={CELL}
          height={CELL}
          rx={4}
          fill={cellFill(state)}
          stroke={cellStroke(state)}
          strokeWidth={state === 'active-lock' ? 1.8 : 1}
        />
      ))}
    </g>
  );
}

/** Allergen-by-suspect-ingredient compatibility matrix SVG highlighting singleton peeling locks. */
export function PeelingMatrixSvg({ frame }: { readonly frame: PeelingTraceFrame }) {
  const matrix = projectPeelingMatrix(frame);
  const cols = Math.max(1, matrix.columns.length);
  const rows = Math.max(1, matrix.rows.length);
  const width = Math.max(360, LABEL_W + cols * (CELL + GAP) + 64);
  const height = TOP_PAD + rows * (CELL + GAP) + 16;

  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Allergen Peeling Matrix (Round ${frame.roundNumber} / ${frame.totalRounds})`}</strong>
        <span className="chart-sub muted">{`Safe appearances: ${frame.safeAppearances}`}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Allergen to suspect ingredient peeling matrix">
        {matrix.columns.map((col, idx) => {
          const x = LABEL_W + idx * (CELL + GAP) + CELL * 0.55;
          const label = col.ingredient.length > 10 ? `${col.ingredient.slice(0, 9)}…` : col.ingredient;
          return (
            <text key={col.ingredientId} x={x} y={TOP_PAD - 8} transform={`rotate(-35 ${x} ${TOP_PAD - 8})`} textAnchor="start" fontSize={10.5} fill="var(--muted)">
              {label}
            </text>
          );
        })}
        {matrix.rows.length === 0
          ? <text x={LABEL_W} y={TOP_PAD + 18} fontSize={11} fill="var(--muted)">No allergens to peel</text>
          : matrix.rows.map((row, r) => <MatrixRowGroup key={row.allergenId} row={row} rowIndex={r} />)}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />Active Lock</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />Locked</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />Candidate</span>
      </div>
    </div>
  );
}
