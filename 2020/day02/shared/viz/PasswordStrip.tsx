import type { AuditTraceFrame, CharCheckStatus } from '../index';

export interface PasswordStripProps {
  readonly frame: AuditTraceFrame;
}

interface CharTileProps {
  readonly index: number;
  readonly char: string;
  readonly status: CharCheckStatus;
  readonly isChecked: boolean;
  readonly isOob: boolean;
}

function tileColor(status: CharCheckStatus): string {
  if (status === 'match') return 'var(--ok)';
  if (status === 'miss') return 'var(--err)';
  return 'var(--border)';
}

function tileTextColor(status: CharCheckStatus): string {
  if (status === 'match') return 'var(--ok)';
  if (status === 'miss') return 'var(--err)';
  return 'var(--text)';
}

function CharTile({ index, char, status, isChecked, isOob }: CharTileProps) {
  const border = `${status !== 'neutral' || isOob ? 2 : 1}px ${isOob ? 'dashed' : 'solid'} ${tileColor(status)}`;
  const color = isOob ? 'var(--muted)' : tileTextColor(status);
  const posColor = isChecked ? 'var(--accent)' : 'var(--muted)';
  return (
    <div
      title={`Pos ${index + 1}: ${isOob ? 'out of bounds' : `'${char}'`} (${status})`}
      style={{
        minWidth: 34,
        padding: '0.25rem 0.35rem',
        borderRadius: 6,
        border,
        background: isOob ? 'var(--bg)' : 'var(--surface)',
        color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <span style={{ fontSize: '0.68rem', color: posColor, fontWeight: isChecked ? 700 : 500 }}>{index + 1}</span>
      <span style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>{char}</span>
    </div>
  );
}

function AuditProgressBar({ frame }: PasswordStripProps) {
  const validPct = (frame.validSoFar / frame.totalEntries) * 100;
  const invalidPct = (frame.invalidSoFar / frame.totalEntries) * 100;
  const label = `Audit progress: ${frame.validSoFar} valid, ${frame.invalidSoFar} invalid of ${frame.totalEntries}`;
  const trackStyle = { display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--bg)', border: '1px solid var(--border)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span>Checked <strong style={{ color: 'var(--text)' }}>{frame.checkedSoFar}</strong> / {frame.totalEntries}</span>
        <span>Valid <strong style={{ color: 'var(--ok)' }}>{frame.validSoFar}</strong> · Invalid <strong style={{ color: 'var(--err)' }}>{frame.invalidSoFar}</strong></span>
      </div>
      <div role="img" aria-label={label} style={trackStyle}>
        <div style={{ width: `${validPct}%`, background: 'var(--ok)' }} />
        <div style={{ width: `${invalidPct}%`, background: 'var(--err)' }} />
      </div>
    </div>
  );
}

function StripHeader({ frame }: PasswordStripProps) {
  const { entry, evaluation, isValid } = frame;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      <code style={{ fontSize: '0.95rem', fontWeight: 700 }}>
        {entry.first}-{entry.second} {entry.letter}: {entry.password}
      </code>
      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="badge">{evaluation.detail}</span>
        <span className={isValid ? 'badge status-solved' : 'badge status-blocked'}>
          {isValid ? 'Valid' : 'Invalid'}
        </span>
      </div>
    </div>
  );
}

function renderCharTiles(frame: PasswordStripProps['frame']) {
  const { evaluation, entry } = frame;
  const maxChecked = evaluation.checkedIndices.length > 0 ? Math.max(...evaluation.checkedIndices) : -1;
  const tileCount = Math.max(entry.password.length, maxChecked + 1);
  const tiles = [];
  for (let i = 0; i < tileCount; i += 1) {
    const isOob = i >= entry.password.length;
    tiles.push(
      <CharTile
        key={i}
        index={i}
        char={isOob ? '∅' : entry.password[i]!}
        status={evaluation.charStatusAt(i)}
        isChecked={evaluation.checkedIndices.includes(i)}
        isOob={isOob}
      />,
    );
  }
  return tiles;
}

export function PasswordStrip({ frame }: PasswordStripProps) {
  return (
    <div className="chart-card">
      <StripHeader frame={frame} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>{renderCharTiles(frame)}</div>
      <AuditProgressBar frame={frame} />
    </div>
  );
}
