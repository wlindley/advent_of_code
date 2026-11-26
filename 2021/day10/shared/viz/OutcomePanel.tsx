import { bigintLog2 } from '../../../../shared/core';
import {
  CLOSE_BRACKETS,
  CORRUPTION_POINTS,
  type AutocompleteScanFrame,
  type CorruptionScanFrame,
  type SyntaxTraceFrame,
} from '../index';
import { getBracketFamilyStyle } from './bracketPalette';

export interface OutcomePanelProps {
  readonly frame: SyntaxTraceFrame;
}

function CorruptionOutcome({ frame }: { readonly frame: CorruptionScanFrame }) {
  const line = frame.currentLine;
  const clashSummary = line.status === 'corrupted'
    ? `Expected ${line.expected ?? 'none (empty stack)'}, found ${line.found} (+${line.corruptionScore.toLocaleString()})`
    : line.status === 'incomplete'
      ? `Incomplete (${line.openStack.length} unclosed openers) — skipped in Part 1`
      : 'Complete — balanced brackets';

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: '0 0 0.65rem', justifyContent: 'space-between' }}>
        <span className="eyebrow">Syntax Clash &amp; Illegal Closer Tally</span>
        <span className="badge" style={line.status === 'corrupted' ? { borderColor: 'var(--err)', color: 'var(--err)' } : undefined}>
          {clashSummary}
        </span>
      </div>
      <div className="metrics-grid">
        {CLOSE_BRACKETS.map((closer) => {
          const count = frame.corruptionCounts[closer];
          const subtotal = BigInt(count) * CORRUPTION_POINTS[closer];
          const style = getBracketFamilyStyle(closer);
          return (
            <div key={closer} className="metric-tile" style={{ borderColor: count > 0 ? style.accentVar : 'var(--border)' }}>
              <span className="eyebrow" style={{ color: style.accentVar }}>
                Closer <code>{closer}</code> ({CORRUPTION_POINTS[closer].toLocaleString()} pts)
              </span>
              <strong>{count} × = {subtotal.toLocaleString()}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutocompleteOutcome({ frame }: { readonly frame: AutocompleteScanFrame }) {
  const line = frame.currentLine;
  const maxLog = bigintLog2(frame.maxInspectedScore) + 1;
  const medianIdx = frame.runningMedianLine.lineIndex;

  return (
    <div className="card stack" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <span className="eyebrow">Completion Tail &amp; Base-5 Trail</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Line Score: <strong>{line.autocompleteScore.toLocaleString()}</strong>
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {line.autocompleteSteps.map((step, idx) => {
          const family = getBracketFamilyStyle(step.closer);
          return (
            <span key={idx} className="badge" style={{ borderColor: family.accentVar, color: family.accentVar, background: 'var(--bg)' }}>
              <code>{step.closer}</code> (+{step.points.toString()}) → {step.runningScore.toLocaleString()}
            </span>
          );
        })}
      </div>
      <div className="stack" style={{ gap: '0.35rem' }}>
        <span className="eyebrow">Sorted Incomplete Scores ({frame.sortedInspectedLines.length}) · Log2 Scale</span>
        {frame.sortedInspectedLines.map((item) => {
          const widthPct = Math.max(8, Math.round(((bigintLog2(item.autocompleteScore) + 1) / maxLog) * 100));
          const isMedian = item.lineIndex === medianIdx;
          const isCurrent = item.lineIndex === line.lineIndex;
          const barColor = isMedian ? 'var(--gold)' : isCurrent ? 'var(--accent)' : 'var(--muted)';
          return (
            <div key={item.lineIndex} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
              <span className="muted">L{item.lineIndex + 1}{isMedian ? ' ★' : ''}</span>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${widthPct}%`, height: '100%', background: barColor }} />
              </div>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: isMedian ? 'var(--gold)' : 'var(--text)', fontWeight: isMedian ? 700 : 400 }}>
                {item.autocompleteScore.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Policy-aware diagnostic panel showing Part 1 illegal closer tallies or Part 2 autocomplete median bars. */
export function OutcomePanel({ frame }: OutcomePanelProps) {
  return frame.kind === 'corruption-score' ? <CorruptionOutcome frame={frame} /> : <AutocompleteOutcome frame={frame} />;
}
