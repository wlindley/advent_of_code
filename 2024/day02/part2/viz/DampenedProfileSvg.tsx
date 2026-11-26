import type { DampenerEvaluation } from '../domain';

function toPointX(idx: number, count: number): number {
  return count <= 1 ? 160 : 28 + (idx / (count - 1)) * 264;
}

function toPointY(val: number, minVal: number, span: number): number {
  return 168 - ((val - minVal) / span) * 116;
}

function statusSummary(evaluation: DampenerEvaluation | null): { readonly label: string; readonly color: string } {
  if (!evaluation) return { label: 'Ready', color: 'var(--muted)' };
  if (evaluation.outcome.kind === 'native-safe') return { label: 'Native Safe', color: 'var(--ok)' };
  if (evaluation.outcome.kind === 'dampened-safe') {
    const flipNote = evaluation.didTrendFlip ? ' · trend flipped' : '';
    return { label: `Dampened: drop [${evaluation.outcome.removedIndex}]${flipNote}`, color: 'var(--accent)' };
  }
  const fail = evaluation.outcome.initialFailure;
  return { label: `Unsafe: ${fail.reason} (Δ${fail.delta})`, color: 'var(--gold)' };
}

function DampenedBridge({
  levels, minVal, span, removedIdx,
}: {
  readonly levels: readonly number[]; readonly minVal: number; readonly span: number; readonly removedIdx: number;
}) {
  if (removedIdx <= 0 || removedIdx >= levels.length - 1) return null;
  const x1 = toPointX(removedIdx - 1, levels.length);
  const y1 = toPointY(levels[removedIdx - 1]!, minVal, span);
  const x2 = toPointX(removedIdx + 1, levels.length);
  const y2 = toPointY(levels[removedIdx + 1]!, minVal, span);
  const xr = toPointX(removedIdx, levels.length);
  const yr = toPointY(levels[removedIdx]!, minVal, span);
  const ctrlY = Math.max(30, Math.min(182, (y1 + y2) / 2 + (yr < (y1 + y2) / 2 ? 22 : -22)));
  return <path d={`M ${x1} ${y1} Q ${xr} ${ctrlY} ${x2} ${y2}`} fill="none" stroke="var(--ok)" strokeWidth={2.5} strokeDasharray="5 3" />;
}

function ProfileStepLine({
  idx, levels, minVal, span, failIdx, removedIdx,
}: {
  readonly idx: number; readonly levels: readonly number[]; readonly minVal: number; readonly span: number;
  readonly failIdx: number | null; readonly removedIdx: number | null;
}) {
  if (idx >= levels.length - 1) return null;
  const x1 = toPointX(idx, levels.length);
  const y1 = toPointY(levels[idx]!, minVal, span);
  const x2 = toPointX(idx + 1, levels.length);
  const y2 = toPointY(levels[idx + 1]!, minVal, span);
  const touchesRemoved = removedIdx !== null && (idx === removedIdx || idx + 1 === removedIdx);
  const isFail = failIdx === idx;
  const color = touchesRemoved ? 'var(--border)' : isFail ? 'var(--gold)' : failIdx !== null && idx > failIdx && removedIdx === null ? 'var(--border)' : 'var(--ok)';
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={isFail && !touchesRemoved ? 3 : 2} strokeDasharray={touchesRemoved ? '3 3' : undefined} />;
}

function ProfileNode({
  val, idx, count, minVal, span, failIdx, removedIdx,
}: {
  readonly val: number; readonly idx: number; readonly count: number; readonly minVal: number; readonly span: number;
  readonly failIdx: number | null; readonly removedIdx: number | null;
}) {
  const x = toPointX(idx, count);
  const y = toPointY(val, minVal, span);
  const isRemoved = removedIdx === idx;
  const isFailNode = !isRemoved && (failIdx === idx || failIdx === idx - 1);
  const stroke = isRemoved ? 'var(--muted)' : isFailNode ? 'var(--gold)' : 'var(--accent)';
  return (
    <g>
      <circle cx={x} cy={y} r={4.5} fill="var(--surface)" stroke={stroke} strokeWidth={2} opacity={isRemoved ? 0.65 : 1} />
      {isRemoved && <line x1={x - 6} y1={y - 6} x2={x + 6} y2={y + 6} stroke="var(--gold)" strokeWidth={2} />}
      {isRemoved && <line x1={x - 6} y1={y + 6} x2={x + 6} y2={y - 6} stroke="var(--gold)" strokeWidth={2} />}
      <text x={x} y={y - 9} textAnchor="middle" fontSize={10} fontWeight={600} fill={isRemoved ? 'var(--muted)' : 'var(--text)'} textDecoration={isRemoved ? 'line-through' : undefined}>{val}</text>
    </g>
  );
}

function ProfileBody({ evaluation, minVal, span }: {
  readonly evaluation: DampenerEvaluation; readonly minVal: number; readonly span: number;
}) {
  const levels = evaluation.report.levels;
  const failIdx = evaluation.initialFailure?.index ?? null;
  const removedIdx = evaluation.removedIndex;
  const endTrimmed = removedIdx === 0 || removedIdx === levels.length - 1;
  return (
    <g>
      {levels.map((val, idx) => (
        <g key={idx}>
          <ProfileStepLine idx={idx} levels={levels} minVal={minVal} span={span} failIdx={failIdx} removedIdx={removedIdx} />
          <ProfileNode val={val} idx={idx} count={levels.length} minVal={minVal} span={span} failIdx={failIdx} removedIdx={removedIdx} />
        </g>
      ))}
      {removedIdx !== null && <DampenedBridge levels={levels} minVal={minVal} span={span} removedIdx={removedIdx} />}
      {endTrimmed && <text x={24} y={39} fontSize={9.5} fontWeight={600} fill="var(--accent)">endpoint trimmed</text>}
      {evaluation.didTrendFlip && <text x={298} y={39} textAnchor="end" fontSize={9.5} fontWeight={700} fill="var(--gold)">trend flipped</text>}
    </g>
  );
}

export function DampenedProfileSvg({ evaluation }: { readonly evaluation: DampenerEvaluation | null }) {
  const levels = evaluation?.report.levels ?? [];
  const minVal = levels.length > 0 ? Math.min(...levels) : 0;
  const maxVal = levels.length > 0 ? Math.max(...levels) : 1;
  const status = statusSummary(evaluation);
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Dampened report level profile" style={{ maxWidth: '100%', display: 'block' }}>
      <rect x={12} y={24} width={296} height={168} rx={6} fill="var(--bg)" stroke="var(--border)" />
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Dampener Profile</text>
      <text x={304} y={15} textAnchor="end" fontSize={11} fontWeight={700} fill={status.color}>{status.label}</text>
      {evaluation && levels.length > 0 ? (
        <ProfileBody evaluation={evaluation} minVal={minVal} span={Math.max(1, maxVal - minVal)} />
      ) : (
        <text x={160} y={112} textAnchor="middle" fontSize={11} fill="var(--muted)">Step forward to inspect a report</text>
      )}
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">Level sequence index (✕ = removed level)</text>
    </svg>
  );
}
