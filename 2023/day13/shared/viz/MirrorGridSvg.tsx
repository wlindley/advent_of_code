import { useMemo, useState } from 'react';
import type { GridCoord, MirrorPattern, ReflectionMatch, TerrainCell } from '../index';

export interface MirrorGridSvgProps {
  readonly pattern: MirrorPattern;
  readonly match: ReflectionMatch;
}

const PAD_LEFT = 26;
const PAD_TOP = 20;
const PAD_END = 10;

function coordKey(row: number, col: number): string {
  return `${row},${col}`;
}

function sameCoord(a: GridCoord | null, row: number, col: number): boolean {
  return a !== null && a.row === row && a.col === col;
}

function buildSmudgeSet(match: ReflectionMatch): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const pair of match.mismatches) {
    keys.add(coordKey(pair.near.row, pair.near.col));
    keys.add(coordKey(pair.far.row, pair.far.col));
  }
  return keys;
}

function cellFill(cell: TerrainCell, isOverhang: boolean): string {
  if (cell === '#') return isOverhang ? '#8c959f' : '#24292f';
  return isOverhang ? 'var(--bg)' : 'var(--surface)';
}

function MirrorCell({
  row, col, cell, cellSize, isOverhang, isHighlighted, isSmudge, onHover,
}: {
  readonly row: number;
  readonly col: number;
  readonly cell: TerrainCell;
  readonly cellSize: number;
  readonly isOverhang: boolean;
  readonly isHighlighted: boolean;
  readonly isSmudge: boolean;
  readonly onHover: (coord: GridCoord | null) => void;
}) {
  const x = PAD_LEFT + col * cellSize;
  const y = PAD_TOP + row * cellSize;
  const inset = Math.max(1, cellSize * 0.08);
  return (
    <g onMouseEnter={() => onHover({ row, col })} onMouseLeave={() => onHover(null)}>
      <rect
        x={x + 0.5} y={y + 0.5} width={cellSize - 1} height={cellSize - 1} rx={2}
        fill={cellFill(cell, isOverhang)}
        stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={isHighlighted ? 2 : 0.75}
        opacity={isOverhang && !isHighlighted ? 0.55 : 1}
      />
      {cell === '.' && cellSize >= 14 && (
        <circle
          cx={x + cellSize / 2} cy={y + cellSize / 2} r={Math.max(1.2, cellSize * 0.1)}
          fill={isOverhang ? 'var(--border)' : 'var(--muted)'} pointerEvents="none"
        />
      )}
      {isSmudge && (
        <rect
          x={x + inset} y={y + inset} width={cellSize - inset * 2} height={cellSize - inset * 2}
          rx={2} fill="none" stroke="var(--ok)" strokeWidth={2.2} pointerEvents="none"
        />
      )}
    </g>
  );
}

function AxisGuideLine({ pattern, match, cellSize }: {
  readonly pattern: MirrorPattern;
  readonly match: ReflectionMatch;
  readonly cellSize: number;
}) {
  const isVertical = match.orientation === 'vertical';
  const x1 = isVertical ? PAD_LEFT + match.index * cellSize : PAD_LEFT - 6;
  const x2 = isVertical ? x1 : PAD_LEFT + pattern.width * cellSize + 6;
  const y1 = isVertical ? PAD_TOP - 6 : PAD_TOP + match.index * cellSize;
  const y2 = isVertical ? PAD_TOP + pattern.height * cellSize + 6 : y1;
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold)" strokeWidth={3} strokeDasharray="6 3" pointerEvents="none" />
  );
}

/** Interactive SVG terrain grid highlighting reflection axis, overhang, smudges, and mirrored pairs. */
export function MirrorGridSvg({ pattern, match }: MirrorGridSvgProps) {
  const [hovered, setHovered] = useState<GridCoord | null>(null);
  const smudgeSet = useMemo(() => buildSmudgeSet(match), [match]);
  const partner = hovered ? match.mirrorOf(hovered.row, hovered.col, pattern) : null;
  const cellSize = Math.max(10, Math.min(28, Math.floor(520 / Math.max(pattern.width, pattern.height))));
  const svgWidth = PAD_LEFT + pattern.width * cellSize + PAD_END;
  const svgHeight = PAD_TOP + pattern.height * cellSize + PAD_END;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', background: 'var(--bg)', overflowX: 'auto' }}>
      <svg width={svgWidth} height={svgHeight} role="img" aria-label={`Mirror pattern ${pattern.height} by ${pattern.width}`}>
        {Array.from({ length: pattern.width }, (_, c) => (
          <text key={`c-${c}`} x={PAD_LEFT + c * cellSize + cellSize / 2} y={PAD_TOP - 6} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {c + 1}
          </text>
        ))}
        {pattern.rows.map((row, r) => (
          <g key={`r-${r}`}>
            <text x={PAD_LEFT - 5} y={PAD_TOP + r * cellSize + cellSize * 0.65} textAnchor="end" fontSize={9} fill="var(--muted)">
              {r + 1}
            </text>
            {Array.from(row, (ch, c) => (
              <MirrorCell
                key={c}
                row={r}
                col={c}
                cell={ch as TerrainCell}
                cellSize={cellSize}
                isOverhang={match.mirrorOf(r, c, pattern) === null}
                isHighlighted={sameCoord(hovered, r, c) || sameCoord(partner, r, c)}
                isSmudge={smudgeSet.has(coordKey(r, c))}
                onHover={setHovered}
              />
            ))}
          </g>
        ))}
        <AxisGuideLine pattern={pattern} match={match} cellSize={cellSize} />
      </svg>
      <div className="muted" style={{ fontSize: '0.76rem', marginTop: '0.35rem' }}>
        {hovered
          ? `Hover (${hovered.row + 1}, ${hovered.col + 1}) -> ${partner ? `mirrors (${partner.row + 1}, ${partner.col + 1})` : 'overhang (unpaired)'}`
          : 'Hover any cell to trace its mirrored partner across the gold axis; dimmed cells overhang.'}
      </div>
    </div>
  );
}
