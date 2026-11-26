import type { MinuteSnapshot, RobotType } from '../index';

export interface BlueprintChartProps {
  readonly blueprintId: number;
  readonly timeLimit: number;
  readonly snapshots: readonly MinuteSnapshot[];
  readonly activeMinute: number;
}

interface SeriesSpec {
  readonly key: RobotType;
  readonly label: string;
  readonly color: string;
}

const SERIES: readonly SeriesSpec[] = [
  { key: 'ore', label: 'Ore Bots', color: 'var(--accent)' },
  { key: 'clay', label: 'Clay Bots', color: 'var(--warn)' },
  { key: 'obsidian', label: 'Obsidian Bots', color: '#6e40c9' },
  { key: 'geode', label: 'Geode Bots', color: 'var(--gold)' },
];

const W = 640;
const H = 220;
const PAD = { top: 18, right: 20, bottom: 28, left: 38 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function xAt(minute: number, timeLimit: number): number {
  return PAD.left + (minute / Math.max(1, timeLimit)) * PLOT_W;
}

function yAt(value: number, maxY: number): number {
  return PAD.top + PLOT_H - (value / Math.max(1, maxY)) * PLOT_H;
}

function buildPolyline(
  snapshots: readonly MinuteSnapshot[],
  timeLimit: number,
  maxY: number,
  pick: (snap: MinuteSnapshot) => number,
): string {
  return snapshots
    .map((s) => `${xAt(s.minute, timeLimit).toFixed(1)},${yAt(pick(s), maxY).toFixed(1)}`)
    .join(' ');
}

function findMaxY(snapshots: readonly MinuteSnapshot[]): number {
  let maxVal = 4;
  for (const s of snapshots) {
    maxVal = Math.max(
      maxVal,
      s.robots.ore,
      s.robots.clay,
      s.robots.obsidian,
      s.robots.geode,
      s.resources.geode,
    );
  }
  return maxVal;
}

/** SVG timeline chart of robot fleet growth and cumulative geodes for one blueprint. */
export function BlueprintChart({ blueprintId, timeLimit, snapshots, activeMinute }: BlueprintChartProps) {
  const maxY = findMaxY(snapshots);
  const cursorX = xAt(activeMinute, timeLimit);
  const activeSnap = snapshots[activeMinute] ?? snapshots[snapshots.length - 1]!;
  const geodePoints = buildPolyline(snapshots, timeLimit, maxY, (s) => s.resources.geode);
  const yTicks = [0, Math.round(maxY / 2), maxY];
  const xTicks = [0, Math.round(timeLimit / 4), Math.round(timeLimit / 2), Math.round((3 * timeLimit) / 4), timeLimit];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', background: 'var(--surface)' }}>
      <div className="meta-row" style={{ marginTop: 0, justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.9rem' }}>Blueprint #{blueprintId} Fleet &amp; Geodes (0–{timeLimit}m)</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Stock at {activeMinute}m: <code>{activeSnap.resources.ore} ore · {activeSnap.resources.clay} clay · {activeSnap.resources.obsidian} obs · {activeSnap.resources.geode} geode</code>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Blueprint ${blueprintId} production timeline`}>
        {yTicks.map((tick) => {
          const y = yAt(tick, maxY);
          return (
            <g key={`y-${tick}`}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{tick}</text>
            </g>
          );
        })}
        {xTicks.map((tick) => {
          const x = xAt(tick, timeLimit);
          return (
            <text key={`x-${tick}`} x={x} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{tick}m</text>
          );
        })}
        <polyline fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeDasharray="5 3" points={geodePoints} />
        {SERIES.map((s) => (
          <polyline
            key={s.key}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            points={buildPolyline(snapshots, timeLimit, maxY, (snap) => snap.robots[s.key])}
          />
        ))}
        {snapshots.map((snap) => {
          if (!snap.action) return null;
          const color = SERIES.find((s) => s.key === snap.action)?.color ?? 'var(--text)';
          return (
            <circle
              key={`build-${snap.minute}`}
              cx={xAt(snap.minute, timeLimit)}
              cy={yAt(snap.robots[snap.action], maxY)}
              r={snap.minute === activeMinute ? 5 : 3}
              fill={color}
              stroke="var(--surface)"
              strokeWidth="1.5"
            />
          );
        })}
        <line x1={cursorX} y1={PAD.top} x2={cursorX} y2={H - PAD.bottom} stroke="var(--text)" strokeWidth="1.5" opacity="0.65" />
      </svg>
      <div className="meta-row" style={{ marginBottom: 0 }}>
        {SERIES.map((s) => (
          <span key={s.key} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 3, background: s.color, display: 'inline-block' }} />
            {s.label}: <code>{activeSnap.robots[s.key]}</code>
          </span>
        ))}
        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 10, height: 3, background: 'var(--ok)', display: 'inline-block' }} />
          Geodes: <code>{activeSnap.resources.geode}</code>
        </span>
      </div>
    </div>
  );
}
