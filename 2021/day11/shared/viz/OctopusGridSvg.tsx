import type { ReactNode } from 'react';
import type { OctopusStepFrame } from '../index';

const CELL_COLORS = [
  '#f6f8fa',
  '#edf2f7',
  '#e2ecf8',
  '#d3e3f8',
  '#bfd8f6',
  '#a4c9f2',
  '#84b6ed',
  '#5f9fe6',
  '#2d7dd2',
  '#0969da',
] as const;

const PAD = 10;
const BOARD_SIZE = 360;

interface CellRenderProps {
  readonly row: number;
  readonly col: number;
  readonly cell: number;
  readonly energy: number;
  readonly flashed: boolean;
  readonly showLabel: boolean;
}

function renderCell({ row, col, cell, energy, flashed, showLabel }: CellRenderProps): ReactNode {
  const x = PAD + col * cell;
  const y = PAD + row * cell;
  const fill = flashed ? '#fef3c7' : (CELL_COLORS[energy] ?? '#f6f8fa');
  const textFill = flashed ? 'var(--gold)' : energy >= 8 ? 'var(--surface)' : 'var(--text)';
  const fontSize = Math.max(10, Math.floor(cell * 0.44));

  return (
    <g key={`${row}-${col}`}>
      <rect
        x={x + 0.75}
        y={y + 0.75}
        width={Math.max(1, cell - 1.5)}
        height={Math.max(1, cell - 1.5)}
        rx={Math.min(5, cell * 0.16)}
        fill={fill}
        stroke={flashed ? 'var(--gold)' : 'var(--border)'}
        strokeWidth={flashed ? 2 : 0.8}
      />
      {showLabel && (
        <text
          x={x + cell / 2}
          y={y + cell / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fontWeight={flashed ? 700 : 600}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill={textFill}
        >
          {energy}
        </text>
      )}
    </g>
  );
}

function buildGridCells(frame: OctopusStepFrame, cell: number): ReactNode[] {
  const { grid } = frame;
  const showLabel = Math.max(grid.rows, grid.cols) <= 15;
  const nodes: ReactNode[] = [];
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      nodes.push(
        renderCell({
          row: r,
          col: c,
          cell,
          energy: grid.at(r, c),
          flashed: frame.flashedAt(r, c),
          showLabel,
        }),
      );
    }
  }
  return nodes;
}

/** Accessible light-mode SVG energy heatmap highlighting flashed octopuses and synchronized steps. */
export function OctopusGridSvg({ frame }: { readonly frame: OctopusStepFrame }) {
  const { rows, cols } = frame.grid;
  const inner = BOARD_SIZE - PAD * 2;
  const cell = inner / Math.max(rows, cols);
  const width = cols * cell + PAD * 2;
  const height = rows * cell + PAD * 2;
  const cells = buildGridCells(frame, cell);
  const status = frame.isSynchronized ? 'synchronized' : `${frame.stepFlashes} flashes`;

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ marginTop: 0, justifyContent: 'space-between' }}>
        <strong>Octopus Energy Grid ({rows}×{cols})</strong>
        <div className="meta-row" style={{ margin: 0, fontSize: '0.78rem' }}>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Flashed (0)
          </span>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            High Energy (8–9)
          </span>
          <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
            Full Sync Border
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        style={{ maxWidth: '460px', margin: '0 auto' }}
        role="img"
        aria-label={`Octopus energy grid ${rows} by ${cols} at step ${frame.step}, ${status}`}
      >
        <rect
          x={2}
          y={2}
          width={width - 4}
          height={height - 4}
          rx={8}
          fill="var(--surface)"
          stroke={frame.isSynchronized ? 'var(--ok)' : 'var(--border)'}
          strokeWidth={frame.isSynchronized ? 3.5 : 1}
        />
        {cells}
      </svg>
    </div>
  );
}
