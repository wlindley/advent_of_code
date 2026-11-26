import type { PasswordTraceFrame, RunLengthPolicy } from '../index';

export interface OdometerStripProps {
  readonly frame: PasswordTraceFrame;
  readonly policy: RunLengthPolicy;
}

const WHEEL_WIDTH = 76;
const WHEEL_GAP = 12;
const WHEEL_STEP = WHEEL_WIDTH + WHEEL_GAP;
const START_X = 24;
const SVG_WIDTH = START_X * 2 + WHEEL_WIDTH * 6 + WHEEL_GAP * 5;
const SVG_HEIGHT = 148;

function runStrokeColor(length: number, policy: RunLengthPolicy): string {
  if (policy.acceptsRun(length)) return 'var(--ok)';
  if (length >= 2) return 'var(--warn)';
  return 'var(--border)';
}

function runTintFill(length: number, policy: RunLengthPolicy): string {
  if (policy.acceptsRun(length)) return 'var(--surface)';
  if (length >= 2) return 'var(--bg)';
  return 'var(--surface)';
}

function wheelRunLength(frame: PasswordTraceFrame, index: number): number {
  const match = frame.candidate.runs.find(
    (run) => index >= run.startIndex && index < run.startIndex + run.length,
  );
  return match === undefined ? 1 : match.length;
}

function WheelCell({
  digit,
  index,
  runLength,
  policy,
}: {
  readonly digit: number;
  readonly index: number;
  readonly runLength: number;
  readonly policy: RunLengthPolicy;
}) {
  const x = START_X + index * WHEEL_STEP;
  const centerX = x + WHEEL_WIDTH / 2;
  const stroke = runStrokeColor(runLength, policy);
  const fill = runTintFill(runLength, policy);
  const prevDigit = (digit + 9) % 10;
  const nextDigit = (digit + 1) % 10;

  return (
    <g>
      <rect
        x={x}
        y={20}
        width={WHEEL_WIDTH}
        height={84}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={runLength >= 2 ? 2.25 : 1.25}
      />
      <text x={centerX} y={37} textAnchor="middle" fontSize={12} fill="var(--muted)">
        {prevDigit}
      </text>
      <text
        x={centerX}
        y={72}
        textAnchor="middle"
        fontSize={30}
        fontWeight={700}
        fill="var(--text)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {digit}
      </text>
      <text x={centerX} y={96} textAnchor="middle" fontSize={12} fill="var(--muted)">
        {nextDigit}
      </text>
    </g>
  );
}

function RunBracket({
  startIndex,
  length,
  policy,
}: {
  readonly startIndex: number;
  readonly length: number;
  readonly policy: RunLengthPolicy;
}) {
  const x1 = START_X + startIndex * WHEEL_STEP + 6;
  const x2 = START_X + (startIndex + length) * WHEEL_STEP - WHEEL_GAP - 6;
  const midX = (x1 + x2) / 2;
  const stroke = runStrokeColor(length, policy);
  const textColor = length >= 2 ? stroke : 'var(--muted)';
  const label = length >= 2 ? `×${length} ${policy.acceptsRun(length) ? 'ok' : 'skip'}` : '×1';

  return (
    <g>
      <path
        d={`M ${x1} 110 L ${x1} 122 L ${x2} 122 L ${x2} 110`}
        fill="none"
        stroke={stroke}
        strokeWidth={length >= 2 ? 2.25 : 1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={midX} y={138} textAnchor="middle" fontSize={11} fontWeight={600} fill={textColor}>
        {label}
      </text>
    </g>
  );
}

function JumpSummary({ frame }: { readonly frame: PasswordTraceFrame }) {
  const jumpText =
    frame.previousValue === null
      ? `Start ${frame.range.low} → ${frame.candidate.value} (skipped ${frame.skippedIntegers})`
      : `Jump ${frame.previousValue} → ${frame.candidate.value} (skipped ${frame.skippedIntegers})`;

  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span
        className="badge"
        style={{
          borderColor: frame.accepted ? 'var(--ok)' : 'var(--err)',
          color: frame.accepted ? 'var(--ok)' : 'var(--err)',
        }}
      >
        {frame.accepted ? 'Accepted' : 'Rejected'}
      </span>
      <span className="badge">{jumpText}</span>
    </div>
  );
}

/** Mechanical 6-wheel password odometer with run-length brackets and jump badge. */
export function OdometerStrip({ frame, policy }: OdometerStripProps) {
  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <JumpSummary frame={frame} />
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={`Odometer candidate ${frame.candidate.value}`}
        style={{
          width: '100%',
          maxWidth: `${SVG_WIDTH}px`,
          height: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          background: 'var(--bg)',
          display: 'block',
        }}
      >
        {frame.candidate.digits.map((digit, index) => (
          <WheelCell
            key={index}
            digit={digit}
            index={index}
            runLength={wheelRunLength(frame, index)}
            policy={policy}
          />
        ))}
        {frame.candidate.runs.map((run) => (
          <RunBracket
            key={`${run.startIndex}-${run.length}`}
            startIndex={run.startIndex}
            length={run.length}
            policy={policy}
          />
        ))}
      </svg>
    </div>
  );
}
