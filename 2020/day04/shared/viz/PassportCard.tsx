import {
  STANDARD_PASSPORT_FIELDS,
  type FieldCheckResult,
  type FieldCheckStatus,
  type PassportTraceFrame,
} from '../index';

export interface PassportCardProps {
  readonly frame: PassportTraceFrame;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const STANDARD_SET = new Set<string>(STANDARD_PASSPORT_FIELDS);

function statusBorderColor(status: FieldCheckStatus): string {
  if (status === 'valid') return 'var(--ok)';
  if (status === 'missing' || status === 'invalid') return 'var(--err)';
  return 'var(--border)';
}

function statusTextColor(status: FieldCheckStatus): string {
  if (status === 'valid') return 'var(--ok)';
  if (status === 'missing' || status === 'invalid') return 'var(--err)';
  return 'var(--muted)';
}

function FieldTile({ check }: { readonly check: FieldCheckResult }) {
  const borderColor = statusBorderColor(check.status);
  const textColor = statusTextColor(check.status);
  const isHex = check.field === 'hcl' && check.value !== undefined && HEX_COLOR.test(check.value);
  const borderStyle = check.status === 'missing' ? 'dashed' : 'solid';

  return (
    <div
      style={{
        padding: '0.5rem 0.65rem',
        borderRadius: 8,
        border: `1.5px ${borderStyle} ${borderColor}`,
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <code style={{ fontWeight: 700, color: 'var(--text)' }}>{check.field}</code>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>
          {check.status}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minHeight: '1.3rem' }}>
        {isHex && (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 3,
              border: '1px solid var(--border)',
              background: check.value,
              flexShrink: 0,
            }}
          />
        )}
        <code style={{ fontSize: '0.88rem', color: check.value === undefined ? 'var(--muted)' : 'var(--text)' }}>
          {check.value ?? '—'}
        </code>
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{check.note}</span>
    </div>
  );
}

function ScanProgressBar({ frame }: PassportCardProps) {
  const validPct = (frame.validSoFar / frame.totalRecords) * 100;
  const invalidPct = (frame.invalidSoFar / frame.totalRecords) * 100;
  const label = `Scan progress: ${frame.validSoFar} valid, ${frame.invalidSoFar} invalid of ${frame.totalRecords}`;
  const trackStyle = { display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--bg)', border: '1px solid var(--border)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span>Checked <strong style={{ color: 'var(--text)' }}>{frame.checkedSoFar}</strong> / {frame.totalRecords}</span>
        <span>Valid <strong style={{ color: 'var(--ok)' }}>{frame.validSoFar}</strong> · Invalid <strong style={{ color: 'var(--err)' }}>{frame.invalidSoFar}</strong></span>
      </div>
      <div role="img" aria-label={label} style={trackStyle}>
        <div style={{ width: `${validPct}%`, background: 'var(--ok)' }} />
        <div style={{ width: `${invalidPct}%`, background: 'var(--err)' }} />
      </div>
    </div>
  );
}

function CardHeader({ frame }: PassportCardProps) {
  const { evaluation, isValid } = frame;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
      <strong style={{ color: 'var(--text)' }}>
        Passport #{frame.recordIndex + 1} ({frame.record.fieldCount} fields)
      </strong>
      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="badge">{evaluation.detail}</span>
        <span className={isValid ? 'badge status-solved' : 'badge status-blocked'}>
          {isValid ? 'Valid' : 'Invalid'}
        </span>
      </div>
    </div>
  );
}

/** Displays field-by-field validation status and cumulative progress for one passport trace frame. */
export function PassportCard({ frame }: PassportCardProps) {
  const extraKeys = frame.record.fieldKeys.filter((key) => !STANDARD_SET.has(key));
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '0.5rem' };

  return (
    <div className="chart-card">
      <CardHeader frame={frame} />
      <div style={gridStyle}>
        {frame.evaluation.fieldChecks.map((check) => (
          <FieldTile key={check.field} check={check} />
        ))}
      </div>
      {extraKeys.length > 0 && (
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          Extra non-standard fields ignored: {extraKeys.join(', ')}
        </span>
      )}
      <ScanProgressBar frame={frame} />
    </div>
  );
}
