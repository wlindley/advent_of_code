import type { CSSProperties } from 'react';
import type { DockingTraceFrame } from '../index';

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.5rem',
  padding: '0.25rem 0',
  borderBottom: '1px solid var(--border)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.8rem',
  fontVariantNumeric: 'tabular-nums',
};

function WritePreviewPanel({ frame }: { readonly frame: DockingTraceFrame }) {
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Step Writes (${frame.writesInStep})`}</strong>
        <span className="chart-sub muted">{frame.isWriteStep ? 'Decoder output' : 'Mask load'}</span>
      </div>
      {!frame.isWriteStep ? (
        <p className="chart-empty muted">Mask register updated; no memory cells modified.</p>
      ) : (
        <div>
          {frame.writePreview.map((w) => (
            <div key={w.address.toString()} style={ROW_STYLE}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{`mem[${w.address}]`}</span>
              <span style={{ color: 'var(--text)' }}>
                {`${w.previousValue} → `}
                <strong style={{ color: 'var(--ok)' }}>{w.value.toString()}</strong>
              </span>
            </div>
          ))}
          {frame.truncatedWriteCount > 0 && (
            <p className="chart-caption muted">{`+${frame.truncatedWriteCount} additional writes in this step`}</p>
          )}
        </div>
      )}
    </div>
  );
}

function RecentMemoryPanel({ frame }: { readonly frame: DockingTraceFrame }) {
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{`Recent Non-Zero Cells (${frame.nonZeroCount})`}</strong>
        <span className="chart-sub" style={{ color: frame.isFinal ? 'var(--ok)' : 'var(--text)', fontWeight: 600 }}>
          {`Sum: ${frame.memorySum}`}
        </span>
      </div>
      {frame.recentMemory.length === 0 ? (
        <p className="chart-empty muted">All memory addresses currently hold 0.</p>
      ) : (
        <div>
          {frame.recentMemory.map((entry) => (
            <div key={entry.address.toString()} style={ROW_STYLE}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{`mem[${entry.address}]`}</span>
              <strong style={{ color: 'var(--text)' }}>{entry.value.toString()}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Side-by-side step-write preview and bounded MRU non-zero memory ledger. */
export function MemoryLedgerPanels({ frame }: { readonly frame: DockingTraceFrame }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
      <WritePreviewPanel frame={frame} />
      <RecentMemoryPanel frame={frame} />
    </div>
  );
}
