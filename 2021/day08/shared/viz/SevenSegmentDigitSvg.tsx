import { WIRE_INDICES, type DecodedDigit } from '../index';

const SEGMENT_POLYGONS = Object.freeze([
  '11,6 49,6 42,14 18,14',
  '8,9 16,17 16,41 8,46',
  '52,9 44,17 44,41 52,46',
  '11,48 18,43 42,43 49,48 42,53 18,53',
  '8,50 16,55 16,79 8,87',
  '52,50 44,55 44,79 52,87',
  '11,90 49,90 42,82 18,82',
] as const);

export interface SevenSegmentDigitSvgProps {
  readonly digit: DecodedDigit;
  readonly highlighted: boolean;
}

/** Beveled 7-segment LED digit card rendered with light-mode CSS theme tokens. */
export function SevenSegmentDigitSvg({ digit, highlighted }: SevenSegmentDigitSvgProps) {
  const activeColor = highlighted ? 'var(--accent)' : 'var(--text)';
  const cardBorder = highlighted ? 'var(--accent)' : 'var(--border)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.65rem 0.75rem',
        borderRadius: '8px',
        border: `1.5px solid ${cardBorder}`,
        background: 'var(--bg)',
        minWidth: '86px',
      }}
    >
      <svg
        width={60}
        height={96}
        viewBox="0 0 60 96"
        role="img"
        aria-label={`Digit ${digit.value} (${digit.pattern.letters})`}
      >
        {WIRE_INDICES.map((wire) => {
          const active = (digit.canonicalMask & (1 << wire)) !== 0;
          return (
            <polygon
              key={wire}
              points={SEGMENT_POLYGONS[wire]}
              fill={active ? activeColor : 'var(--border)'}
              opacity={active ? 1 : 0.35}
            />
          );
        })}
      </svg>
      <strong style={{ fontSize: '1.05rem', color: highlighted ? 'var(--accent)' : 'var(--text)' }}>
        {digit.value}
      </strong>
      <code className="muted" style={{ fontSize: '0.76rem' }}>
        {digit.pattern.letters} ({digit.pattern.segmentCount})
      </code>
    </div>
  );
}
