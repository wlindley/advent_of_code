import type { EquationTrace } from '../search';

export function VerificationRibbon({ trace }: { readonly trace: EquationTrace }) {
  if (!trace.witness) {
    return (
      <div className="meta-row" style={{ padding: '0.45rem 0.65rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.84rem', fontWeight: 600 }}>
          Unsolvable: no left-to-right operator sequence reaches <code>{trace.equation.target.toString()}</code>.
        </span>
      </div>
    );
  }
  const steps = trace.equation.evaluateSteps(trace.witness);
  const ops = trace.equation.operands;
  return (
    <div className="meta-row" style={{ padding: '0.45rem 0.65rem', borderRadius: 6, border: '1px solid var(--ok)', background: 'var(--surface)' }}>
      <span className="eyebrow" style={{ marginRight: '0.25rem', color: 'var(--ok)' }}>Left-to-right verify</span>
      {ops.map((operand, idx) => (
        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem' }}>
          {idx > 0 && (
            <strong style={{ color: 'var(--accent)' }}>
              <code>{trace.witness![idx - 1]!.symbol}</code>
            </strong>
          )}
          <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--text)' }}>
            <code>{operand.toString()}</code>
            {idx > 0 && (
              <span style={{ color: 'var(--ok)', marginLeft: '0.3rem' }}>
                = <code>{steps[idx]!.toString()}</code>
              </span>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
