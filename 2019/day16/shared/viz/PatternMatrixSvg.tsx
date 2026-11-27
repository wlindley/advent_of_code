import type { FftMode, PatternMatrixLayout } from '../index';

interface PatternMatrixSvgProps {
  readonly mode: FftMode;
  readonly layout: PatternMatrixLayout;
  readonly onSelectRow: (row: number) => void;
}

function MatrixAxes({ layout }: { readonly layout: PatternMatrixLayout }) {
  const indices = Array.from({ length: layout.size }, (_, idx) => idx);
  return (
    <>
      {indices.map((idx) => (
        <g key={idx}>
          <text
            x={layout.originX + idx * layout.cellSize + layout.cellSize / 2}
            y={layout.originY - 6}
            textAnchor="middle"
            className="chart-axis-text"
          >
            {idx}
          </text>
          <text
            x={layout.originX - 8}
            y={layout.originY + idx * layout.cellSize + layout.cellSize * 0.72}
            textAnchor="end"
            className="chart-axis-text"
            style={{ fill: idx === layout.selectedRow ? 'var(--gold)' : 'var(--muted)' }}
          >
            {idx}
          </text>
        </g>
      ))}
    </>
  );
}

function MatrixRowHitTargets({
  layout,
  onSelectRow,
}: {
  readonly layout: PatternMatrixLayout;
  readonly onSelectRow: (row: number) => void;
}) {
  const rows = Array.from({ length: layout.size }, (_, idx) => idx);
  const width = layout.size * layout.cellSize;
  return (
    <>
      {rows.map((row) => (
        <rect
          key={row}
          x={layout.originX}
          y={layout.originY + row * layout.cellSize}
          width={width}
          height={layout.cellSize}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={() => onSelectRow(row)}
        >
          <title>Inspect output row {row}</title>
        </rect>
      ))}
    </>
  );
}

const PANEL_STYLE = {
  padding: '0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
} as const;

const HEADER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginBottom: '0.45rem',
  fontSize: '0.82rem',
  color: 'var(--text)',
} as const;

/** Renders the batched 3-path SVG weight matrix (+1, -1, 0) with interactive row inspection. */
export function PatternMatrixSvg({ mode, layout, onSelectRow }: PatternMatrixSvgProps) {
  const matrixWidth = layout.size * layout.cellSize;
  const previewDigit = Math.abs(layout.rowPreviewSum) % 10;

  return (
    <div style={PANEL_STYLE}>
      <div style={HEADER_STYLE}>
        <strong>{mode === 'tail' ? 'Upper-Triangular Suffix Matrix' : 'Harmonic Pattern Matrix'}</strong>
        <span className="muted">
          Row {layout.selectedRow} · Preview Σ={layout.rowPreviewSum} (mod 10 → {previewDigit})
        </span>
      </div>
      <svg viewBox={layout.viewBox} role="img" aria-label="FFT multiplier weight matrix heatmap" className="chart-svg">
        <MatrixAxes layout={layout} />
        {layout.zeroPath ? <path d={layout.zeroPath} fill="var(--bg)" stroke="var(--border)" strokeWidth={0.5} /> : null}
        {layout.plusPath ? <path d={layout.plusPath} fill="var(--accent)" fillOpacity={0.85} /> : null}
        {layout.minusPath ? <path d={layout.minusPath} fill="var(--err)" fillOpacity={0.85} /> : null}
        <rect x={layout.originX - 1} y={layout.rowHighlightY - 1} width={matrixWidth + 1} height={layout.cellSize + 1} fill="none" stroke="var(--gold)" strokeWidth={1.8} />
        <MatrixRowHitTargets layout={layout} onSelectRow={onSelectRow} />
      </svg>
    </div>
  );
}
