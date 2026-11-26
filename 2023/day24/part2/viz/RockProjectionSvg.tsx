import type { CSSProperties } from 'react';

export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  readonly time: bigint;
}

export interface RockProjectionSvgProps {
  readonly title: string;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly start: ProjectedPoint;
  readonly end: ProjectedPoint;
  readonly active: ProjectedPoint;
  readonly markers: readonly ProjectedPoint[];
}

const SIZE = 260;
const PAD = 26;
const INNER = SIZE - PAD * 2;
const SVG_STYLE: CSSProperties = {
  width: '100%',
  maxWidth: '340px',
  height: 'auto',
  display: 'block',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
};

function toSvgX(nx: number): number {
  return PAD + nx * INNER;
}

function toSvgY(ny: number): number {
  return SIZE - PAD - ny * INNER;
}

function renderMarkers(markers: readonly ProjectedPoint[], activeTime: bigint) {
  return markers.map((pt, idx) => {
    const reached = pt.time <= activeTime;
    return (
      <circle
        key={`${idx}-${pt.time.toString()}`}
        cx={toSvgX(pt.x)}
        cy={toSvgY(pt.y)}
        r={3.2}
        fill={reached ? 'var(--ok)' : 'var(--gold)'}
        opacity={reached ? 0.95 : 0.7}
      />
    );
  });
}

/** Light-mode SVG 2D projection plot for the rock trajectory and sampled collisions. */
export function RockProjectionSvg({
  title,
  xLabel,
  yLabel,
  start,
  end,
  active,
  markers,
}: RockProjectionSvgProps) {
  const sx = toSvgX(start.x);
  const sy = toSvgY(start.y);
  const ax = toSvgX(active.x);
  const ay = toSvgY(active.y);

  return (
    <div style={{ flex: '1 1 250px', minWidth: 0 }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
        {title}
      </div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${title} rock trajectory plot`} style={SVG_STYLE}>
        <rect x={PAD} y={PAD} width={INNER} height={INNER} fill="none" stroke="var(--border)" strokeDasharray="2 3" />
        <text x={SIZE / 2} y={SIZE - 7} textAnchor="middle" fontSize={11} fill="var(--muted)">{xLabel}</text>
        <text x={11} y={SIZE / 2} textAnchor="middle" fontSize={11} fill="var(--muted)">{yLabel}</text>
        <line x1={sx} y1={sy} x2={toSvgX(end.x)} y2={toSvgY(end.y)} stroke="var(--border)" strokeWidth={2.5} strokeDasharray="5 4" />
        <line x1={sx} y1={sy} x2={ax} y2={ay} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={sx} cy={sy} r={3.5} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.8} />
        {renderMarkers(markers, active.time)}
        <circle cx={ax} cy={ay} r={9} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        <circle cx={ax} cy={ay} r={5.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.8} />
      </svg>
    </div>
  );
}
