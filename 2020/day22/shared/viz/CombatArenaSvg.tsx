import {
  MAX_VISIBLE_CARDS,
  projectCombatArena,
  type CombatArenaProjection,
  type CombatTraceFrame,
  type DeckProjection,
  type ProjectedCard,
} from '../index';

const SVG_W = 760;
const BAR_X = 24;
const BAR_W = SVG_W - BAR_X * 2;
const DECK_W = 216;
const P1_X = 24;
const DUEL_X = 266;
const DUEL_W = 228;
const P2_X = 520;
const DECK_Y = 74;
const ROW_H = 22;

function CardChip({
  card,
  x,
  y,
  accent,
}: {
  readonly card: ProjectedCard;
  readonly x: number;
  readonly y: number;
  readonly accent: string;
}) {
  const fill = card.isNewlyWon ? 'color-mix(in srgb, var(--ok) 14%, var(--surface))' : 'var(--surface)';
  const stroke = card.isNewlyWon ? 'var(--ok)' : 'var(--border)';
  return (
    <g>
      <rect x={x} y={y} width={DECK_W} height={19} rx={4} fill={fill} stroke={stroke} strokeWidth={card.isNewlyWon ? 1.5 : 1} />
      <rect x={x} y={y} width={4} height={19} rx={2} fill={card.isNewlyWon ? 'var(--ok)' : accent} />
      <text x={x + 14} y={y + 13} fontSize={11.5} fontWeight={700} fill="var(--text)">{card.value}</text>
      <text x={x + DECK_W - 10} y={y + 13} textAnchor="end" fontSize={10} fill="var(--muted)">{`×${card.positionFromBottom}`}</text>
    </g>
  );
}

function DeckColumn({
  deck,
  x,
  accent,
  label,
}: {
  readonly deck: DeckProjection;
  readonly x: number;
  readonly accent: string;
  readonly label: string;
}) {
  const gapOffset = deck.head.length * ROW_H;
  const tailStartY = DECK_Y + gapOffset + (deck.hiddenCount > 0 ? ROW_H : 0);
  return (
    <g>
      <text x={x} y={DECK_Y - 10} fontSize={11.5} fontWeight={700} fill={deck.isWinner ? 'var(--ok)' : 'var(--text)'}>
        {`${label} (${deck.totalCount}) · Score ${deck.score}`}
      </text>
      {deck.totalCount === 0 && (
        <text x={x + DECK_W / 2} y={DECK_Y + 24} textAnchor="middle" fontSize={11} fill="var(--muted)">Deck Empty</text>
      )}
      {deck.head.map((card, idx) => (
        <CardChip key={`h-${deck.player}-${idx}-${card.value}`} card={card} x={x} y={DECK_Y + idx * ROW_H} accent={accent} />
      ))}
      {deck.hiddenCount > 0 && (
        <text x={x + DECK_W / 2} y={DECK_Y + gapOffset + 14} textAnchor="middle" fontSize={10.5} fill="var(--muted)">
          {`··· +${deck.hiddenCount} hidden cards ···`}
        </text>
      )}
      {deck.tail.map((card, idx) => (
        <CardChip key={`t-${deck.player}-${idx}-${card.value}`} card={card} x={x} y={tailStartY + idx * ROW_H} accent={accent} />
      ))}
    </g>
  );
}

function DuelStage({ proj }: { readonly proj: CombatArenaProjection }) {
  const cx = DUEL_X + DUEL_W / 2;
  const p1Played = proj.played ? String(proj.played[0]) : '—';
  const p2Played = proj.played ? String(proj.played[1]) : '—';
  const p1Won = proj.roundWinner === 1 && proj.played !== null;
  const p2Won = proj.roundWinner === 2 && proj.played !== null;
  const statusText = proj.gameWinner !== null
    ? `Player ${proj.gameWinner} Wins (${proj.winningScore})`
    : proj.roundWinner !== null
      ? `Round -> Player ${proj.roundWinner}`
      : 'Starting Deal';
  return (
    <g>
      <rect x={DUEL_X} y={DECK_Y} width={DUEL_W} height={152} rx={8} fill="var(--bg)" stroke="var(--border)" />
      <text x={cx} y={DECK_Y + 22} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--accent)">{proj.outcomeLabel}</text>
      <rect x={DUEL_X + 18} y={DECK_Y + 38} width={76} height={58} rx={6} fill="var(--surface)" stroke={p1Won ? 'var(--ok)' : 'var(--accent)'} strokeWidth={p1Won ? 2 : 1.25} />
      <text x={DUEL_X + 56} y={DECK_Y + 55} textAnchor="middle" fontSize={10} fill="var(--muted)">P1 Card</text>
      <text x={DUEL_X + 56} y={DECK_Y + 80} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text)">{p1Played}</text>
      <text x={cx} y={DECK_Y + 72} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--muted)">vs</text>
      <rect x={DUEL_X + 134} y={DECK_Y + 38} width={76} height={58} rx={6} fill="var(--surface)" stroke={p2Won ? 'var(--ok)' : 'var(--gold)'} strokeWidth={p2Won ? 2 : 1.25} />
      <text x={DUEL_X + 172} y={DECK_Y + 55} textAnchor="middle" fontSize={10} fill="var(--muted)">P2 Card</text>
      <text x={DUEL_X + 172} y={DECK_Y + 80} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text)">{p2Played}</text>
      <text x={cx} y={DECK_Y + 124} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={proj.gameWinner ? 'var(--ok)' : 'var(--text)'}>{statusText}</text>
      <text x={cx} y={DECK_Y + 141} textAnchor="middle" fontSize={10} fill="var(--muted)">{`Sub-games: ${proj.subGamesStarted}`}</text>
    </g>
  );
}

function deckRows(deck: DeckProjection): number {
  return Math.max(1, deck.head.length + deck.tail.length + (deck.hiddenCount > 0 ? 1 : 0));
}

/** Light-mode SVG rendering card share momentum, center duel stage, and windowed deck ribbons. */
export function CombatArenaSvg({ frame }: { readonly frame: CombatTraceFrame }) {
  const proj = projectCombatArena(frame, MAX_VISIBLE_CARDS);
  const p1BarW = Math.round(BAR_W * proj.p1Share);
  const maxRows = Math.max(deckRows(proj.deck1), deckRows(proj.deck2));
  const height = Math.max(244, DECK_Y + maxRows * ROW_H + 18);

  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Round ${proj.round} / ${proj.totalRounds} · ${proj.outcomeLabel}`}</strong>
        <span className="chart-sub muted">{`Deck share: P1 ${proj.deck1.totalCount} / P2 ${proj.deck2.totalCount}`}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${height}`} role="img" aria-label="Crab Combat duel arena and windowed decks">
        <rect x={BAR_X} y={16} width={BAR_W} height={14} rx={7} fill="var(--gold)" />
        {p1BarW > 0 && <rect x={BAR_X} y={16} width={p1BarW} height={14} rx={7} fill="var(--accent)" />}
        <text x={BAR_X} y={44} fontSize={10.5} fill="var(--muted)">{`P1 Share ${Math.round(proj.p1Share * 100)}%`}</text>
        <text x={BAR_X + BAR_W} y={44} textAnchor="end" fontSize={10.5} fill="var(--muted)">{`P2 Share ${Math.round((1 - proj.p1Share) * 100)}%`}</text>
        <DeckColumn deck={proj.deck1} x={P1_X} accent="var(--accent)" label="Player 1" />
        <DuelStage proj={proj} />
        <DeckColumn deck={proj.deck2} x={P2_X} accent="var(--gold)" label="Player 2" />
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />Player 1</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />Player 2</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />Newly Won Cards (Bottom)</span>
      </div>
    </div>
  );
}
