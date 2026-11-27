import type { CykAnalysis, DerivationSpan, SpanRole } from '../spans';

export interface SpanRibbonProps {
  readonly analysis: CykAnalysis;
}

const MAX_RIBBON_DEPTH = 7;

function spanBorderColor(span: DerivationSpan): string {
  if (span.ruleId === 0) return 'var(--ok)';
  const roleColors: Record<SpanRole, string> = {
    rule42: 'var(--accent)',
    rule31: 'var(--gold)',
    rule: 'var(--border)',
  };
  return roleColors[span.role];
}

function spanTextColor(span: DerivationSpan): string {
  if (span.ruleId === 0) return 'var(--ok)';
  if (span.role === 'rule42') return 'var(--accent)';
  if (span.role === 'rule31') return 'var(--gold)';
  return 'var(--text)';
}

function groupSpansByDepth(spans: readonly DerivationSpan[]): readonly (readonly DerivationSpan[])[] {
  const rows: DerivationSpan[][] = [];
  for (const span of spans) {
    if (span.depth > MAX_RIBBON_DEPTH) continue;
    while (rows.length <= span.depth) rows.push([]);
    rows[span.depth]!.push(span);
  }
  return rows;
}

function CharacterStrip({ message }: { readonly message: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${message.length}, minmax(1.1rem, 1fr))`,
        gap: 2,
      }}
    >
      {Array.from(message, (ch, idx) => (
        <div
          key={idx}
          style={{
            textAlign: 'center',
            padding: '0.2rem 0',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
            fontSize: '0.82rem',
          }}
        >
          {ch}
        </div>
      ))}
    </div>
  );
}

function SpanDepthRow({
  row,
  length,
}: {
  readonly row: readonly DerivationSpan[];
  readonly length: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${length}, minmax(1.1rem, 1fr))`,
        gap: 2,
      }}
    >
      {row.map((span) => (
        <div
          key={`${span.depth}-${span.start}-${span.len}-${span.ruleId}`}
          title={`Rule ${span.ruleId} [${span.start}..${span.start + span.len})`}
          style={{
            gridColumn: `${span.start + 1} / span ${span.len}`,
            textAlign: 'center',
            padding: '0.12rem 0.25rem',
            borderRadius: 4,
            border: `1.5px solid ${spanBorderColor(span)}`,
            background: 'var(--surface)',
            color: spanTextColor(span),
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.72rem',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {`R${span.ruleId}`}
        </div>
      ))}
    </div>
  );
}

/** Displays candidate characters aligned above unfolded witness derivation spans. */
export function SpanRibbon({ analysis }: SpanRibbonProps) {
  const depthRows = groupSpansByDepth(analysis.spans);
  const hiddenCount = analysis.spans.filter((s) => s.depth > MAX_RIBBON_DEPTH).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '0.65rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
        overflowX: 'auto',
      }}
    >
      <CharacterStrip message={analysis.message} />
      {!analysis.matched && (
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          No full Rule 0 witness tree; inspect partial sub-rule matches in the CYK chart below.
        </span>
      )}
      {depthRows.map((row, depth) => (
        <SpanDepthRow key={depth} row={row} length={analysis.message.length} />
      ))}
      {hiddenCount > 0 && (
        <span className="muted" style={{ fontSize: '0.75rem' }}>
          {`+${hiddenCount} deeper witness spans omitted beyond depth ${MAX_RIBBON_DEPTH}`}
        </span>
      )}
    </div>
  );
}
