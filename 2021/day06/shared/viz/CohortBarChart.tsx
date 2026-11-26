import { useId } from 'react';
import {
  buildCohortBars,
  formatCompactBigInt,
  type CohortRole,
  type LanternfishSchool,
} from '../index';

export interface CohortBarChartProps {
  readonly school: LanternfishSchool;
  readonly spawningNext: bigint;
}

const ROLE_COLORS: Record<CohortRole, string> = {
  spawning: 'var(--warn)',
  mature: 'var(--accent)',
  reset: 'var(--gold)',
  juvenile: 'var(--muted)',
  newborn: 'var(--ok)',
};

const LEGEND_ITEMS: readonly (readonly [CohortRole, string])[] = [
  ['spawning', '0: Spawning'],
  ['mature', '1–5: Mature'],
  ['reset', '6: Reset'],
  ['juvenile', '7: Juvenile'],
  ['newborn', '8: Newborn'],
];

const BAR_LEFT = 40;
const BAR_STEP = 64;
const BAR_WIDTH = 44;
const PLOT_TOP = 66;
const PLOT_HEIGHT = 136;
const BASELINE_Y = PLOT_TOP + PLOT_HEIGHT;

function centerOfBar(index: number): number {
  return BAR_LEFT + index * BAR_STEP + BAR_WIDTH / 2;
}

/** 9-column SVG cohort histogram with 0 -> 6 reset and 0 -> 8 spawn recurrence arcs. */
export function CohortBarChart({ school, spawningNext }: CohortBarChartProps) {
  const markerId = useId();
  const bars = buildCohortBars(school);
  const x0 = centerOfBar(0);
  const x6 = centerOfBar(6);
  const x8 = centerOfBar(8);
  const activeFlow = spawningNext > 0n;

  return (
    <figure className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
        <strong>Timer Cohort Distribution (0–8)</strong>
        <span className="chart-sub muted">
          Next step: {formatCompactBigInt(spawningNext)} reset to 6 &amp; spawn at 8
        </span>
      </div>
      <svg viewBox="0 0 640 242" className="chart-svg" role="img" aria-label="Lanternfish timer cohort histogram">
        <defs>
          <marker id={`${markerId}-reset`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,1 L7,4 L0,7 Z" fill="var(--gold)" />
          </marker>
          <marker id={`${markerId}-spawn`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,1 L7,4 L0,7 Z" fill="var(--ok)" />
          </marker>
        </defs>
        <path
          d={`M ${x0} 46 Q ${(x0 + x6) / 2} 22 ${x6} 46`}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={activeFlow ? 1.8 : 1.1}
          strokeDasharray={activeFlow ? undefined : '3 3'}
          opacity={activeFlow ? 0.95 : 0.45}
          markerEnd={`url(#${markerId}-reset)`}
        />
        <text x={(x0 + x6) / 2} y={30} textAnchor="middle" className="chart-ref-text">
          0 → 6 reset
        </text>
        <path
          d={`M ${x0} 46 Q ${(x0 + x8) / 2} 2 ${x8} 46`}
          fill="none"
          stroke="var(--ok)"
          strokeWidth={activeFlow ? 1.8 : 1.1}
          strokeDasharray={activeFlow ? undefined : '3 3'}
          opacity={activeFlow ? 0.95 : 0.45}
          markerEnd={`url(#${markerId}-spawn)`}
        />
        <text x={(x0 + x8) / 2 + 40} y={14} textAnchor="middle" className="chart-axis-text" style={{ fill: 'var(--ok)', fontWeight: 600 }}>
          0 → 8 spawn
        </text>
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = BASELINE_Y - frac * PLOT_HEIGHT;
          return <line key={frac} x1={28} y1={y} x2={616} y2={y} className="chart-grid" />;
        })}
        <line x1={28} y1={BASELINE_Y} x2={616} y2={BASELINE_Y} stroke="var(--border)" strokeWidth={1.5} />
        {bars.map((bar, idx) => {
          const x = BAR_LEFT + idx * BAR_STEP;
          const height = Math.max(bar.count > 0n ? 3 : 0, bar.ratio * PLOT_HEIGHT);
          const y = BASELINE_Y - height;
          const fill = ROLE_COLORS[bar.role];
          return (
            <g key={bar.timer}>
              <rect x={x} y={y} width={BAR_WIDTH} height={height} rx={4} fill={fill} fillOpacity={0.85} />
              <text x={x + BAR_WIDTH / 2} y={y - 6} textAnchor="middle" className="chart-axis-text" style={{ fill: 'var(--text)' }}>
                {bar.compactLabel}
              </text>
              <text x={x + BAR_WIDTH / 2} y={BASELINE_Y + 18} textAnchor="middle" className="chart-axis-text" style={{ fill: 'var(--text)', fontWeight: 600 }}>
                {bar.timer}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {LEGEND_ITEMS.map(([role, label]) => (
          <span key={role} className="chart-legend-item">
            <span aria-hidden="true" style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: ROLE_COLORS[role] }} />
            <span>{label}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}
