import { useMemo } from 'react';
import type { AntennaMap, GridPoint, ResonanceTraceFrame } from '../index';
import { frequencyColor } from './palette';

export interface ResonanceGridSvgProps {
  readonly map: AntennaMap;
  readonly frame: ResonanceTraceFrame | null;
  readonly selectedFrequency: string | null;
}

const CELL = 28;
const PAD = 26;

function toSvgPoint(pt: GridPoint): { readonly x: number; readonly y: number } {
  return { x: PAD + (pt.col + 0.5) * CELL, y: PAD + (pt.row + 0.5) * CELL };
}

function clampToMargin(pt: GridPoint, width: number, height: number): { readonly x: number; readonly y: number } {
  const raw = toSvgPoint(pt);
  return {
    x: Math.max(10, Math.min(width - 10, raw.x)),
    y: Math.max(10, Math.min(height - 10, raw.y)),
  };
}

function GridLines({ rows, cols }: { readonly rows: number; readonly cols: number }) {
  if (rows * cols > 1600) return null;
  const lines = [];
  for (let r = 1; r < rows; r += 1) {
    const y = PAD + r * CELL;
    lines.push(<line key={`r-${r}`} x1={PAD} y1={y} x2={PAD + cols * CELL} y2={y} stroke="var(--border)" strokeOpacity={0.55} />);
  }
  for (let c = 1; c < cols; c += 1) {
    const x = PAD + c * CELL;
    lines.push(<line key={`c-${c}`} x1={x} y1={PAD} x2={x} y2={PAD + rows * CELL} stroke="var(--border)" strokeOpacity={0.55} />);
  }
  return <g aria-hidden="true">{lines}</g>;
}

function ActivePairRay({ frame, width, height }: { readonly frame: ResonanceTraceFrame; readonly width: number; readonly height: number }) {
  const pts = [frame.anchorA, frame.anchorB, ...frame.inBounds, ...frame.outOfBounds].map((p) => clampToMargin(p, width, height));
  const sorted = pts.slice().sort((u, v) => u.x - v.x || u.y - v.y);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const color = frequencyColor(frame.frequency);
  return (
    <g aria-hidden="true">
      <line x1={first.x} y1={first.y} x2={last.x} y2={last.y} stroke={color} strokeWidth={2} strokeDasharray="5 4" strokeOpacity={0.75} />
      {frame.outOfBounds.map((pt) => {
        const pos = clampToMargin(pt, width, height);
        return (
          <g key={`oob-${pt.row}-${pt.col}`} transform={`translate(${pos.x},${pos.y})`}>
            <circle r={7} fill="var(--surface)" stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />
            <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}

function AntinodeOverlays({ map, frame }: { readonly map: AntennaMap; readonly frame: ResonanceTraceFrame }) {
  return (
    <g aria-hidden="true">
      {frame.cumulativeAntinodes.map((pt) => {
        const pos = toSvgPoint(pt);
        const overlapsAntenna = map.isAntennaAt(pt.row, pt.col);
        return (
          <g key={`cum-${pt.row}-${pt.col}`}>
            <rect x={PAD + pt.col * CELL + 2} y={PAD + pt.row * CELL + 2} width={CELL - 4} height={CELL - 4} rx={4} fill="var(--ok)" fillOpacity={0.14} />
            {overlapsAntenna ? (
              <>
                <circle cx={pos.x} cy={pos.y} r={CELL * 0.44} fill="none" stroke="var(--gold)" strokeWidth={2} />
                <circle cx={pos.x} cy={pos.y} r={CELL * 0.34} fill="none" stroke="var(--ok)" strokeWidth={1.8} />
              </>
            ) : (
              <circle cx={pos.x} cy={pos.y} r={4.5} fill="var(--ok)" fillOpacity={0.85} />
            )}
          </g>
        );
      })}
      {frame.added.map((pt) => {
        const pos = toSvgPoint(pt);
        return (
          <g key={`add-${pt.row}-${pt.col}`}>
            <circle cx={pos.x} cy={pos.y} r={CELL * 0.42} fill="var(--ok)" fillOpacity={0.22} stroke="var(--gold)" strokeWidth={2.2} />
            <circle cx={pos.x} cy={pos.y} r={5.5} fill="var(--ok)" stroke="var(--surface)" strokeWidth={1.2} />
          </g>
        );
      })}
      {frame.duplicates.map((pt) => {
        const pos = toSvgPoint(pt);
        return <circle key={`dup-${pt.row}-${pt.col}`} cx={pos.x} cy={pos.y} r={CELL * 0.37} fill="none" stroke="var(--gold)" strokeWidth={2.4} strokeDasharray="3 2" />;
      })}
    </g>
  );
}

function AntennaMarkers({
  map,
  frame,
  selectedFrequency,
}: {
  readonly map: AntennaMap;
  readonly frame: ResonanceTraceFrame | null;
  readonly selectedFrequency: string | null;
}) {
  const entries = useMemo(() => {
    const items: { readonly freq: string; readonly pt: GridPoint }[] = [];
    for (const [freq, points] of map.frequencyGroups) {
      for (const pt of points) items.push({ freq, pt });
    }
    return items;
  }, [map]);

  return (
    <g>
      {entries.map(({ freq, pt }) => {
        const pos = toSvgPoint(pt);
        const isAnchor = frame !== null && (frame.anchorA.equals(pt) || frame.anchorB.equals(pt));
        const dimmed = selectedFrequency !== null && freq !== selectedFrequency && !isAnchor;
        const color = frequencyColor(freq);
        return (
          <g key={`ant-${pt.row}-${pt.col}`} opacity={dimmed ? 0.28 : 1}>
            {isAnchor && <circle cx={pos.x} cy={pos.y} r={CELL * 0.48} fill="none" stroke="var(--accent)" strokeWidth={2.4} />}
            <circle cx={pos.x} cy={pos.y} r={CELL * 0.31} fill={color} stroke="var(--surface)" strokeWidth={1.4} />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace">
              {freq}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Interactive SVG grid showing antennas, collinear ray projections, antinodes, and clipped OOB markers. */
export function ResonanceGridSvg({ map, frame, selectedFrequency }: ResonanceGridSvgProps) {
  const width = map.cols * CELL + PAD * 2;
  const height = map.rows * CELL + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Antenna resonance grid ${map.rows} by ${map.cols}`}
      style={{ width: '100%', maxHeight: 520, display: 'block', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}
    >
      <rect x={PAD} y={PAD} width={map.cols * CELL} height={map.rows * CELL} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
      <GridLines rows={map.rows} cols={map.cols} />
      {frame && <ActivePairRay frame={frame} width={width} height={height} />}
      {frame && <AntinodeOverlays map={map} frame={frame} />}
      <AntennaMarkers map={map} frame={frame} selectedFrequency={selectedFrequency} />
    </svg>
  );
}
