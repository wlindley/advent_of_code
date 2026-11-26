import { HAND_TYPE_LABELS, type CardLabel } from '../cards';
import type { CamelCardsTraceFrame } from '../trace';

export interface CardSpotlightProps {
  readonly frame: CamelCardsTraceFrame;
}

const CARD_STYLE_BASE = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 52,
  padding: '0.5rem 0.65rem',
  borderRadius: 8,
  background: 'var(--bg)',
  border: '2px solid var(--border)',
};

function describeComparison(frame: CamelCardsTraceFrame): string {
  const prev = frame.previousRanked;
  if (!prev) return 'Rank #1 — weakest hand in the deal.';
  if (prev.handType !== frame.ranked.handType) {
    return `Beats #${prev.rank} (${prev.hand.label}, ${prev.handTypeLabel}) on hand type.`;
  }
  const tieIdx = frame.tieBreakIndex;
  if (tieIdx !== undefined) {
    const currCard = frame.ranked.hand.cards[tieIdx]!;
    const prevCard = prev.hand.cards[tieIdx]!;
    return `Tied ${frame.ranked.handTypeLabel} vs #${prev.rank} (${prev.hand.label}); card #${tieIdx + 1} (${currCard} > ${prevCard}).`;
  }
  return `Identical to #${prev.rank} (${prev.hand.label}); input #${frame.ranked.hand.inputIndex + 1} > #${prev.hand.inputIndex + 1}.`;
}

function renderCardTile(
  card: CardLabel,
  idx: number,
  frame: CamelCardsTraceFrame,
) {
  const rule = frame.ranked.rule;
  const isWild = rule.wildLabel === card;
  const isTieBreak = frame.tieBreakIndex === idx;
  const borderColor = isTieBreak ? 'var(--accent)' : isWild ? 'var(--gold)' : 'var(--border)';
  const strength = rule.cardStrength(card);
  const tag = isTieBreak ? 'TIE' : isWild ? 'WILD' : `#${idx + 1}`;
  return (
    <div key={`${idx}-${card}`} style={{ ...CARD_STYLE_BASE, borderColor }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isTieBreak ? 'var(--accent)' : isWild ? 'var(--gold)' : 'var(--muted)' }}>
        {tag}
      </span>
      <strong style={{ fontSize: '1.35rem', lineHeight: 1.2, color: 'var(--text)' }}>{card}</strong>
      <span className="muted" style={{ fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums' }}>
        s={strength}
      </span>
    </div>
  );
}

function renderHexNibbles(frame: CamelCardsTraceFrame) {
  const hexDigits = frame.ranked.hexKey.slice(2).split('');
  const labels = ['Type', 'C1', 'C2', 'C3', 'C4', 'C5'];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
      <span className="muted" style={{ fontSize: '0.78rem' }}>Key {frame.ranked.hexKey}:</span>
      {hexDigits.map((digit, i) => (
        <span key={labels[i]} className="badge" style={{ fontFamily: 'ui-monospace, monospace', color: i === 0 ? 'var(--gold)' : 'var(--text)' }}>
          {labels[i]}={digit}
        </span>
      ))}
    </div>
  );
}

export function CardSpotlight({ frame }: CardSpotlightProps) {
  const { ranked } = frame;
  return (
    <section
      aria-label="Active ranked hand spotlight"
      style={{ padding: '0.8rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className="meta-row" style={{ marginTop: 0 }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Rank #{frame.rank} / {frame.totalHands}
        </span>
        <span className="badge">{HAND_TYPE_LABELS[ranked.handType]}</span>
        <span className="badge">Bid: <strong>{ranked.hand.bid.toString()}</strong></span>
        <span className="badge status-solved">Winnings: <strong>{frame.winnings.toString()}</strong></span>
        <span className="badge">Running: <strong className="gold">{frame.runningWinnings.toString()}</strong></span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', margin: '0.65rem 0' }}>
        {ranked.hand.cards.map((card, idx) => renderCardTile(card, idx, frame))}
      </div>
      <p style={{ margin: '0.35rem 0', fontSize: '0.86rem', color: 'var(--text)' }}>
        {describeComparison(frame)}
      </p>
      {renderHexNibbles(frame)}
    </section>
  );
}
