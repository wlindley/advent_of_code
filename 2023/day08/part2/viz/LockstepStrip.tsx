import { isGhostTargetLabel, type GhostConvergenceFrame } from '../domain';

export interface LockstepStripProps {
  readonly frame: GhostConvergenceFrame;
}

const MONO = { fontFamily: 'ui-monospace, monospace' } as const;

export function LockstepStrip({ frame }: LockstepStripProps) {
  const { lockstepTimeline, plan } = frame;
  if (lockstepTimeline.length === 0) return null;
  const network = plan.cycles[0]!.network;

  return (
    <section
      aria-label="Lockstep simulation strip"
      style={{
        padding: '0.6rem 0.75rem',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        overflowX: 'auto',
      }}
    >
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.4rem' }}>
        Lockstep Ghost Strip (steps 0..{lockstepTimeline.length - 1})
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', ...MONO }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
            <th style={{ textAlign: 'left', padding: '0.25rem 0.4rem' }}>Step</th>
            {plan.cycles.map((cycle) => (
              <th key={cycle.startId} style={{ textAlign: 'left', padding: '0.25rem 0.4rem' }}>
                {cycle.startLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lockstepTimeline.map((entry) => {
            const rowBg = entry.allTargets && frame.isConverged ? 'var(--ok)' : 'transparent';
            const rowFg = entry.allTargets && frame.isConverged ? 'var(--surface)' : 'var(--text)';
            return (
              <tr key={entry.step} style={{ background: rowBg, color: rowFg, borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.25rem 0.4rem', fontWeight: entry.allTargets ? 700 : 500 }}>
                  {entry.step}
                </td>
                {entry.nodeIds.map((nodeId, idx) => {
                  const label = network.labelOf(nodeId);
                  const isZ = isGhostTargetLabel(label);
                  const color = entry.allTargets && frame.isConverged ? 'var(--surface)' : isZ ? 'var(--gold)' : 'var(--text)';
                  return (
                    <td key={`${entry.step}-${idx}`} style={{ padding: '0.25rem 0.4rem', fontWeight: isZ ? 700 : 400, color }}>
                      {label}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
