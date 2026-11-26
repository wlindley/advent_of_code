import { HAND_TYPE_LABELS, HAND_TYPE_ORDER, type HandType } from '../cards';
import { findFirstFrameForTier, type CamelCardsTraceFrame } from '../trace';

export interface TierDistributionChartProps {
  readonly frame: CamelCardsTraceFrame;
  readonly finalCounts: readonly number[];
  readonly frames: readonly CamelCardsTraceFrame[];
  readonly onSelectFrame: (index: number) => void;
}

function renderTierRow(
  tier: HandType,
  currentCount: number,
  totalCount: number,
  maxCount: number,
  isActiveTier: boolean,
  firstIndex: number | undefined,
  onSelectFrame: (index: number) => void,
) {
  const totalPct = maxCount > 0 ? (totalCount / maxCount) * 100 : 0;
  const currPct = maxCount > 0 ? (currentCount / maxCount) * 100 : 0;
  return (
    <div key={tier} style={{ display: 'grid', gridTemplateColumns: '122px 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: isActiveTier ? 700 : 500, color: isActiveTier ? 'var(--accent)' : 'var(--text)' }}>
        {HAND_TYPE_LABELS[tier]}
      </span>
      <div style={{ position: 'relative', height: 14, borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${totalPct}%`, background: 'var(--border)', opacity: 0.45 }} />
        <div style={{ position: 'relative', height: '100%', width: `${currPct}%`, background: isActiveTier ? 'var(--accent)' : 'var(--ok)' }} />
      </div>
      <button
        type="button"
        disabled={firstIndex === undefined}
        onClick={() => firstIndex !== undefined && onSelectFrame(firstIndex)}
        style={{ fontSize: '0.75rem', padding: '0.18rem 0.45rem', minWidth: 64, fontVariantNumeric: 'tabular-nums' }}
        title={firstIndex === undefined ? 'No sampled hands in this tier' : `Jump to first ${HAND_TYPE_LABELS[tier]}`}
      >
        {currentCount}/{totalCount}
      </button>
    </div>
  );
}

export function TierDistributionChart({
  frame,
  finalCounts,
  frames,
  onSelectFrame,
}: TierDistributionChartProps) {
  const maxCount = Math.max(1, ...finalCounts);
  return (
    <section
      aria-label="Hand type tier distribution"
      style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.55rem' }}>
        <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Tier Distribution</strong>
        <span className="muted" style={{ fontSize: '0.76rem' }}>Click count to jump</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {HAND_TYPE_ORDER.map((tier) =>
          renderTierRow(
            tier,
            frame.cumulativeTierCounts[tier]!,
            finalCounts[tier]!,
            maxCount,
            frame.ranked.handType === tier,
            findFirstFrameForTier(frames, tier),
            onSelectFrame,
          ),
        )}
      </div>
    </section>
  );
}
