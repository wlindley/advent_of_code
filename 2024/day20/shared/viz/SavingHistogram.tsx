import type { RaceConditionSnapshot } from '../index';

export interface SavingHistogramProps {
  readonly snapshot: RaceConditionSnapshot;
}

const WIDTH = 620;
const HEIGHT = 124;
const PAD_X = 28;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

/** Compact SVG histogram revealing cheat saving buckets progressively across playback. */
export function SavingHistogram({ snapshot }: SavingHistogramProps) {
  const buckets = snapshot.summary.buckets;
  if (buckets.length === 0) {
    return (
      <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
        No cheats save at least {snapshot.config.minSaving} picoseconds.
      </p>
    );
  }

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slotW = plotW / buckets.length;
  const barW = Math.max(2, slotW - Math.min(4, slotW * 0.25));
  const firstSaving = buckets[0]!.saving;
  const lastSaving = buckets[buckets.length - 1]!.saving;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Cheat savings histogram (${snapshot.revealedBucketCount} of ${buckets.length} buckets revealed)`}
      style={{
        width: '100%',
        maxWidth: WIDTH,
        display: 'block',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <line x1={PAD_X} y1={PAD_TOP + plotH} x2={WIDTH - PAD_X} y2={PAD_TOP + plotH} stroke="var(--border)" />
      {buckets.map((bucket, idx) => {
        const revealed = idx < snapshot.revealedBucketCount;
        const isActive = snapshot.activeCheat !== null && bucket.saving === snapshot.activeSaving;
        const barH = Math.max(2, (bucket.count / maxCount) * plotH);
        const x = PAD_X + idx * slotW + (slotW - barW) / 2;
        const y = PAD_TOP + plotH - barH;
        const fill = isActive ? 'var(--gold)' : revealed ? 'var(--accent)' : 'var(--border)';

        return (
          <g key={bucket.saving} opacity={revealed ? 1 : 0.35}>
            <title>{`Save ${bucket.saving} ps: ${bucket.count} cheats`}</title>
            <rect x={x} y={y} width={barW} height={barH} rx={2} fill={fill} />
          </g>
        );
      })}
      <text x={PAD_X} y={HEIGHT - 6} fontSize="11" fill="var(--text)">
        Min {firstSaving} ps
      </text>
      <text x={WIDTH / 2} y={HEIGHT - 6} fontSize="11" textAnchor="middle" fill="var(--text)">
        {snapshot.activeCheat ? `Active: ${snapshot.activeSaving} ps` : `Peak count: ${maxCount}`}
      </text>
      <text x={WIDTH - PAD_X} y={HEIGHT - 6} fontSize="11" textAnchor="end" fill="var(--text)">
        Max {lastSaving} ps
      </text>
    </svg>
  );
}
