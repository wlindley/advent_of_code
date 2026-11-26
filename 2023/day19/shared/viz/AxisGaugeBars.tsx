import { CATEGORIES, type Category, type ConditionalRule, type RatingBox, type TerminalOutcome } from '../index';

export interface AxisGaugeBarsProps {
  readonly box: RatingBox;
  readonly activeRule: ConditionalRule | null;
  readonly outcome: TerminalOutcome | null;
}

const DEFAULT_AXIS_MAX = 4000n;

function computeAxisCeiling(box: RatingBox, activeRule: ConditionalRule | null): bigint {
  let maxVal = DEFAULT_AXIS_MAX;
  for (const cat of CATEGORIES) {
    const end = box.rangeFor(cat).end;
    if (end > maxVal) maxVal = end;
  }
  if (activeRule) {
    const threshold = BigInt(activeRule.threshold);
    if (threshold > maxVal) maxVal = threshold;
  }
  return maxVal;
}

function toPercent(numerator: bigint, ceiling: bigint): number {
  const clamped = numerator < 0n ? 0n : numerator > ceiling ? ceiling : numerator;
  return Number((clamped * 1000n) / ceiling) / 10;
}

function barColor(cat: Category, activeRule: ConditionalRule | null, outcome: TerminalOutcome | null): string {
  if (outcome === 'A') return 'var(--ok)';
  if (outcome === 'R') return 'var(--err)';
  if (activeRule?.category === cat) return 'var(--gold)';
  return 'var(--accent)';
}

/** Four horizontal [1..4000]+ axis gauge bars showing the active RatingBox and rule threshold cut line. */
export function AxisGaugeBars({ box, activeRule, outcome }: AxisGaugeBarsProps) {
  const ceiling = computeAxisCeiling(box, activeRule);

  return (
    <div
      className="stack"
      style={{
        gap: '0.55rem',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
      role="region"
      aria-label="Category rating ranges"
    >
      {CATEGORIES.map((cat) => {
        const iv = box.rangeFor(cat);
        const leftPct = toPercent(iv.start - 1n, ceiling);
        const rawWidthPct = toPercent(iv.length, ceiling);
        const widthPct = Math.min(100 - leftPct, Math.max(1.2, rawWidthPct));
        const hasCut = activeRule?.category === cat;
        const cutPct = hasCut ? toPercent(BigInt(activeRule.threshold), ceiling) : 0;
        const rangeLabel = iv.start === iv.end ? iv.start.toString() : `${iv.start.toString()}..${iv.end.toString()}`;

        return (
          <div key={cat} style={{ display: 'grid', gridTemplateColumns: '2rem 1fr 8.5rem', alignItems: 'center', gap: '0.65rem' }}>
            <strong style={{ textTransform: 'uppercase', color: 'var(--text)' }}>{cat}</strong>
            <div
              style={{
                position: 'relative',
                height: '1.15rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: barColor(cat, activeRule, outcome),
                  opacity: 0.88,
                }}
              />
              {hasCut && (
                <div
                  title={`Threshold ${activeRule.op} ${activeRule.threshold}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${cutPct}%`,
                    width: '2px',
                    background: 'var(--text)',
                  }}
                />
              )}
            </div>
            <code style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {rangeLabel}
            </code>
          </div>
        );
      })}
    </div>
  );
}
