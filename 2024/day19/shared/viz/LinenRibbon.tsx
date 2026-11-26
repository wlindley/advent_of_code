import { bigintLog2 } from '../../../../shared/core';
import type { DesignAnalysis, StripeColor } from '../index';

const STRIPE_STYLE: Record<StripeColor, { readonly bg: string; readonly fg: string; readonly border: string }> = {
  w: { bg: '#f8fafc', fg: '#0f172a', border: '#64748b' },
  u: { bg: '#2563eb', fg: '#ffffff', border: '#1d4ed8' },
  b: { bg: '#1e293b', fg: '#ffffff', border: '#0f172a' },
  r: { bg: '#dc2626', fg: '#ffffff', border: '#b91c1c' },
  g: { bg: '#16a34a', fg: '#ffffff', border: '#15803d' },
};

function logScore(ways: bigint): number {
  return ways === 0n ? 0 : 1 + bigintLog2(ways);
}

function StripeRow({ sequence }: { readonly sequence: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {Array.from(sequence, (ch, idx) => {
        const s = STRIPE_STYLE[ch as StripeColor];
        return (
          <span
            key={idx}
            title={`pos ${idx}: ${ch}`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 20, height: 24, padding: '0 4px', borderRadius: 4,
              background: s.bg, color: s.fg, border: `1.5px solid ${s.border}`,
              fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', fontWeight: 700,
            }}
          >{ch}</span>
        );
      })}
    </div>
  );
}

function WitnessOrStall({ analysis }: { readonly analysis: DesignAnalysis }) {
  if (analysis.witnessDecomposition) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        <span className="eyebrow" style={{ marginRight: '0.2rem' }}>Witness</span>
        {analysis.witnessDecomposition.map((tile, idx) => (
          <span key={idx} style={{ display: 'inline-flex', padding: '2px 5px', borderRadius: 6, border: '1px solid var(--ok)', background: 'var(--bg)' }}>
            <StripeRow sequence={tile} />
          </span>
        ))}
      </div>
    );
  }
  const stall = analysis.furthestReachable;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', color: 'var(--err)' }}>
      <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>
        Stalled at index {stall} / {analysis.design.length}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
        Reachable prefix <code>{stall > 0 ? analysis.design.slice(0, stall) : '∅'}</code> stalls at{' '}
        <strong style={{ color: 'var(--err)' }}><code>{analysis.design[stall]}</code></strong>
      </span>
    </div>
  );
}

function PrefixDpChart({ analysis }: { readonly analysis: DesignAnalysis }) {
  const scores = analysis.prefixWays.map(logScore);
  const maxScore = Math.max(1, ...scores);
  const count = scores.length;
  const width = Math.max(280, count * 14);
  const height = 78;
  const stall = analysis.furthestReachable;

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>
        DP Prefix Ways (log₂ scale, indices 0..{analysis.design.length})
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`DP prefix ways chart for ${analysis.design}`}
        style={{ width: '100%', maxHeight: 92, display: 'block', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}
      >
        {scores.map((score, idx) => {
          const step = (width - 16) / count;
          const barW = Math.max(4, step - 2);
          const barH = score === 0 ? 3 : Math.max(6, (score / maxScore) * (height - 18));
          const isEnd = idx === count - 1;
          const fill = score === 0 ? 'var(--border)' : isEnd ? 'var(--ok)' : !analysis.possible && idx === stall ? 'var(--err)' : 'var(--accent)';
          return (
            <rect key={idx} x={8 + idx * step} y={height - 6 - barH} width={barW} height={barH} rx={2} fill={fill}>
              <title>{`dp[${idx}] = ${analysis.prefixWays[idx]!.toString()}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

/** Renders stripe ribbon, witness towel tiles or stall marker, and DP prefix chart. */
export function LinenRibbon({ analysis }: { readonly analysis: DesignAnalysis }) {
  return (
    <div className="stack" style={{ padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Target Design ({analysis.design.length} stripes)</div>
        <StripeRow sequence={analysis.design} />
      </div>
      <WitnessOrStall analysis={analysis} />
      <PrefixDpChart analysis={analysis} />
    </div>
  );
}
