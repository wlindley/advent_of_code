import type { GhostCycle } from '../domain';

export type GhostTrackStatus = 'pending' | 'active' | 'synced';

export interface GhostRhoTrackProps {
  readonly cycle: GhostCycle;
  readonly status: GhostTrackStatus;
  readonly isConverged: boolean;
}

const MONO = { fontFamily: 'ui-monospace, monospace' } as const;
const STEM_START = 24;
const LOOP_CX = 212;
const LOOP_CY = 36;
const LOOP_R = 24;
const LOOP_ENTRY_X = LOOP_CX - LOOP_R;

function statusColors(status: GhostTrackStatus, isConverged: boolean) {
  if (status === 'active') {
    return { border: 'var(--accent)', badgeBg: 'var(--accent)', badgeFg: 'var(--surface)', label: 'MERGING' };
  }
  if (status === 'synced') {
    const color = isConverged ? 'var(--ok)' : 'var(--gold)';
    return { border: color, badgeBg: color, badgeFg: 'var(--surface)', label: isConverged ? 'CONVERGED' : 'SYNCED' };
  }
  return { border: 'var(--border)', badgeBg: 'var(--bg)', badgeFg: 'var(--muted)', label: 'PENDING' };
}

function cyclePoint(step: number, cycle: GhostCycle): { x: number; y: number } {
  const offset = (step - cycle.prefixLength) / cycle.cycleLength;
  const angle = Math.PI + offset * Math.PI * 2;
  return { x: LOOP_CX + LOOP_R * Math.cos(angle), y: LOOP_CY + LOOP_R * Math.sin(angle) };
}

function stemX(step: number, prefixLength: number): number {
  const ratio = prefixLength <= 0 ? 0 : step / prefixLength;
  return STEM_START + ratio * (LOOP_ENTRY_X - STEM_START);
}

function renderRhoSvg(cycle: GhostCycle, strokeColor: string) {
  const startX = cycle.prefixLength > 0 ? STEM_START : LOOP_ENTRY_X;
  return (
    <svg viewBox="0 0 264 72" width="100%" height={72} role="img" aria-label={`Rho cycle for ${cycle.startLabel}`}>
      {cycle.prefixLength > 0 && (
        <line x1={STEM_START} y1={LOOP_CY} x2={LOOP_ENTRY_X} y2={LOOP_CY} stroke={strokeColor} strokeWidth={2} />
      )}
      <circle cx={LOOP_CX} cy={LOOP_CY} r={LOOP_R} fill="none" stroke={strokeColor} strokeWidth={2} />
      <circle cx={startX} cy={LOOP_CY} r={5} fill="var(--accent)" />
      <text x={startX} y={LOOP_CY + 16} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text)" style={MONO}>
        {cycle.startLabel}
      </text>
      {cycle.preCycleHits.map((hit) => (
        <circle key={`pre-${hit.step}`} cx={stemX(hit.step, cycle.prefixLength)} cy={LOOP_CY} r={4.5} fill="var(--gold)" stroke="var(--text)" strokeWidth={1} />
      ))}
      {cycle.cycleHits.map((hit) => {
        const pt = cyclePoint(hit.step, cycle);
        return <circle key={`cyc-${hit.step}`} cx={pt.x} cy={pt.y} r={4.5} fill="var(--ok)" stroke="var(--text)" strokeWidth={1} />;
      })}
    </svg>
  );
}

export function GhostRhoTrack({ cycle, status, isConverged }: GhostRhoTrackProps) {
  const palette = statusColors(status, isConverged);
  const chips = cycle.congruences.slice(0, 4);
  const extra = cycle.congruences.length - chips.length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 264px', gap: '0.6rem', alignItems: 'center', padding: '0.5rem 0.7rem', borderRadius: 8, border: `1.5px solid ${palette.border}`, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <strong style={{ ...MONO, color: 'var(--text)' }}>{cycle.startLabel}</strong>
          <span className="badge" style={{ background: palette.badgeBg, color: palette.badgeFg, borderColor: palette.border, fontSize: '0.72rem' }}>
            {palette.label}
          </span>
          <span className="muted" style={{ fontSize: '0.78rem' }}>
            μ={cycle.prefixLength}, c={cycle.cycleLength}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <span key={c.key} className="badge" style={{ ...MONO, fontSize: '0.74rem', borderColor: 'var(--border)', color: 'var(--text)' }}>
              {c.toString()}
            </span>
          ))}
          {extra > 0 && <span className="muted" style={{ fontSize: '0.74rem' }}>+{extra} more</span>}
        </div>
      </div>
      {renderRhoSvg(cycle, palette.border)}
    </div>
  );
}
