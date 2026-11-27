import {
  MAX_INTERSECTION_BARS,
  projectIntersectionBars,
  type AllergenCandidateSummary,
  type IntersectionBar,
  type IntersectionBarState,
  type IntersectionTraceFrame,
} from '../index';

const SVG_W = 760;
const LEFT_X = 20;
const RIGHT_X = 400;
const LABEL_W = 104;
const BAR_MAX_W = 196;
const ROW_H = 22;

function barColor(state: IntersectionBarState): string {
  if (state === 'active-safe') return 'var(--ok)';
  if (state === 'safe') return 'color-mix(in srgb, var(--ok) 38%, var(--surface))';
  if (state === 'active-suspect') return 'var(--gold)';
  return 'color-mix(in srgb, var(--accent) 36%, var(--surface))';
}

function barStroke(state: IntersectionBarState): string {
  if (state === 'active-safe' || state === 'safe') return 'var(--ok)';
  return state === 'active-suspect' ? 'var(--gold)' : 'var(--accent)';
}

function AllergenRow({ item, y }: { readonly item: AllergenCandidateSummary; readonly y: number }) {
  const stroke = item.isInCurrentFood ? 'var(--gold)' : 'var(--border)';
  const labelFill = item.isInCurrentFood ? 'var(--gold)' : 'var(--text)';
  return (
    <g>
      <rect x={LEFT_X} y={y} width={SVG_W - LEFT_X * 2} height={18} rx={4} fill="var(--surface)" stroke={stroke} strokeWidth={item.isInCurrentFood ? 1.5 : 1} />
      <text x={LEFT_X + 8} y={y + 13} fontSize={11} fontWeight={700} fill={labelFill}>{item.name}</text>
      <text x={LEFT_X + 122} y={y + 13} fontSize={10.5} fill="var(--muted)">{`${item.candidateCount} cand:`}</text>
      <text x={LEFT_X + 184} y={y + 13} fontSize={10.5} fill="var(--text)">{item.candidatePreview}</text>
    </g>
  );
}

function BarRow({ bar, x, y }: { readonly bar: IntersectionBar; readonly x: number; readonly y: number }) {
  const barW = Math.max(4, Math.round(bar.barFrac * BAR_MAX_W));
  const label = bar.name.length > 12 ? `${bar.name.slice(0, 11)}…` : bar.name;
  return (
    <g>
      <text x={x + LABEL_W - 6} y={y + 13} textAnchor="end" fontSize={11} fontWeight={bar.isInCurrentFood ? 700 : 500} fill="var(--text)">
        {label}
      </text>
      <rect x={x + LABEL_W} y={y + 2} width={barW} height={14} rx={3} fill={barColor(bar.state)} stroke={barStroke(bar.state)} strokeWidth={1} />
      <text x={x + LABEL_W + barW + 6} y={y + 13} fontSize={10.5} fill="var(--muted)">{bar.frequency}</text>
    </g>
  );
}

/** Partitioned SVG showing per-allergen candidate intersections and safe/suspect frequency bars. */
export function IntersectionMatrixSvg({ frame }: { readonly frame: IntersectionTraceFrame }) {
  const proj = projectIntersectionBars(frame, MAX_INTERSECTION_BARS);
  const algRows = Math.max(1, proj.allergens.length);
  const barTop = 30 + algRows * 21 + 26;
  const barRows = Math.max(1, proj.suspectBars.length, proj.safeBars.length);
  const height = barTop + barRows * ROW_H + 30;
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Food #${frame.scannedCount} / ${frame.totalFoods} Candidate Intersection`}</strong>
        <span className="chart-sub muted">{`Food ingredients: ${frame.currentFood.ingredientCount} · Allergens: ${frame.currentFood.allergenCount}`}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${height}`} role="img" aria-label="Allergen candidate intersection and safe ingredient partition">
        <text x={LEFT_X} y={18} fontSize={11} fontWeight={700} fill="var(--text)">Allergen Candidate Sets</text>
        {proj.allergens.length === 0
          ? <text x={LEFT_X} y={40} fontSize={11} fill="var(--muted)">No allergens declared</text>
          : proj.allergens.map((item, i) => <AllergenRow key={item.allergenId} item={item} y={26 + i * 21} />)}
        <text x={LEFT_X} y={barTop - 8} fontSize={11} fontWeight={700} fill="var(--text)">{`Suspect Ingredients (${proj.totalSuspectCount})`}</text>
        <text x={RIGHT_X} y={barTop - 8} fontSize={11} fontWeight={700} fill="var(--ok)">{`Guaranteed Safe (${proj.totalSafeCount})`}</text>
        {proj.suspectBars.map((bar, i) => <BarRow key={bar.ingredientId} bar={bar} x={LEFT_X} y={barTop + i * ROW_H} />)}
        {proj.safeBars.map((bar, i) => <BarRow key={bar.ingredientId} bar={bar} x={RIGHT_X} y={barTop + i * ROW_H} />)}
        {proj.hiddenSuspectCount > 0 && (
          <text x={LEFT_X + LABEL_W} y={height - 10} fontSize={10.5} fill="var(--muted)">{`+${proj.hiddenSuspectCount} more suspect`}</text>
        )}
        {proj.hiddenSafeCount > 0 && (
          <text x={RIGHT_X + LABEL_W} y={height - 10} fontSize={10.5} fill="var(--muted)">{`+${proj.hiddenSafeCount} more safe`}</text>
        )}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />Safe (In Food / Safe)</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />Suspect in Current Food</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />Suspect</span>
      </div>
    </div>
  );
}
