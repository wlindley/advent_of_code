import type { CSSProperties } from 'react';
import type { BracketChar, CharRole, SyntaxLineResult } from '../index';
import { getBracketFamilyStyle } from './bracketPalette';

export interface BracketLineStageProps {
  readonly line: SyntaxLineResult;
}

function getStatusBadgeStyle(status: SyntaxLineResult['status']): CSSProperties {
  if (status === 'corrupted') return { borderColor: 'var(--err)', color: 'var(--err)' };
  if (status === 'incomplete') return { borderColor: 'var(--warn)', color: 'var(--warn)' };
  return { borderColor: 'var(--ok)', color: 'var(--ok)' };
}

function getCharCellStyle(ch: BracketChar, role: CharRole, isExpectedOpener: boolean): CSSProperties {
  const family = getBracketFamilyStyle(ch);
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: '1.45rem', height: '1.7rem', padding: '0 0.25rem', borderRadius: '5px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.9rem',
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
  };
  if (role === 'clash') {
    return { ...base, border: '2px solid var(--err)', background: 'var(--surface)', color: 'var(--err)', fontWeight: 700 };
  }
  if (role === 'unscanned') return { ...base, opacity: 0.32, color: 'var(--muted)' };
  if (role === 'matched') return { ...base, opacity: 0.5, color: 'var(--muted)' };
  return {
    ...base,
    border: isExpectedOpener ? `2px solid ${family.accentVar}` : `1px solid ${family.accentVar}`,
    background: 'var(--surface)',
    color: family.accentVar,
    fontWeight: 700,
  };
}

/** Monospace line scanner strip and live unclosed-opener stack for the active line. */
export function BracketLineStage({ line }: BracketLineStageProps) {
  const roles = line.charRoles;
  const expectedOpenIndex = line.status === 'corrupted' ? line.expectedOpenIndex : null;
  const stack = line.openStack;

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: '0 0 0.65rem', justifyContent: 'space-between' }}>
        <span className="eyebrow">Line #{line.lineIndex + 1} · {line.text.length} chars</span>
        <span className="badge" style={getStatusBadgeStyle(line.status)}>{line.status.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }} aria-label="Bracket line scan">
        {Array.from(line.text, (ch, idx) => {
          const role = roles[idx]!;
          const isExp = expectedOpenIndex === idx;
          return (
            <span key={idx} style={getCharCellStyle(ch as BracketChar, role, isExp)} title={`#${idx} ${role}`}>
              {ch}
            </span>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
        <span className="eyebrow" style={{ marginRight: '0.35rem' }}>Open Stack ({stack.length}):</span>
        {stack.length === 0 ? (
          <span className="badge muted">(empty)</span>
        ) : (
          stack.map((ch, idx) => {
            const family = getBracketFamilyStyle(ch);
            const isTop = idx === stack.length - 1;
            return (
              <span
                key={idx}
                className="badge"
                style={{
                  borderColor: family.accentVar,
                  borderWidth: isTop ? '2px' : '1px',
                  color: family.accentVar,
                  background: 'var(--surface)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {ch}{isTop ? ' · TOP' : ''}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
