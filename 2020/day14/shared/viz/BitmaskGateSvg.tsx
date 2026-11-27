import {
  projectBitGateColumns,
  projectStepSummary,
  type BitGateColumn,
  type BitGateRole,
  type DockingTraceFrame,
} from '../index';

const LEFT = 72;
const COL_W = 20;
const SVG_W = 804;
const SVG_H = 136;

function roleColor(role: BitGateRole): string {
  if (role === 'force-one') return 'var(--accent)';
  if (role === 'force-zero') return 'var(--warn)';
  if (role === 'float') return 'var(--gold)';
  return 'var(--muted)';
}

function gateFill(color: string, active: boolean): string {
  return active ? `color-mix(in srgb, ${color} 16%, var(--surface))` : 'var(--bg)';
}

function GateColumnCell({ col }: { readonly col: BitGateColumn }) {
  const x = LEFT + col.index * COL_W;
  const color = roleColor(col.role);
  const outColor = col.role === 'float' ? 'var(--gold)' : col.changed ? 'var(--ok)' : 'var(--text)';
  const outFill = col.changed ? gateFill(outColor, true) : 'var(--surface)';
  const showPower = col.bitPower === 35 || col.bitPower % 4 === 0;
  return (
    <g>
      {col.index > 0 && col.index % 4 === 0 && (
        <line x1={x} y1={16} x2={x} y2={126} stroke="var(--border)" strokeDasharray="2 2" />
      )}
      {showPower && (
        <text x={x + 9} y={14} textAnchor="middle" fontSize={9} fill="var(--muted)">
          {col.bitPower}
        </text>
      )}
      <rect x={x + 1} y={22} width={17} height={24} rx={3} fill={gateFill(color, col.role !== 'pass')} stroke={color} />
      <text x={x + 9.5} y={38} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
        {col.maskChar}
      </text>
      <rect x={x + 1} y={56} width={17} height={24} rx={3} fill="var(--surface)" stroke="var(--border)" />
      <text x={x + 9.5} y={72} textAnchor="middle" fontSize={11} fill="var(--text)">
        {col.inputBit ?? '·'}
      </text>
      <rect x={x + 1} y={92} width={17} height={24} rx={3} fill={outFill} stroke={col.changed ? outColor : 'var(--border)'} />
      <text x={x + 9.5} y={108} textAnchor="middle" fontSize={11} fontWeight={col.changed ? 700 : 500} fill={outColor}>
        {col.outputBit ?? '·'}
      </text>
    </g>
  );
}

/** Interactive 36-bit bitmask gate diagram showing mask, input, and output bits. */
export function BitmaskGateSvg({ frame }: { readonly frame: DockingTraceFrame }) {
  const columns = projectBitGateColumns(frame);
  const summary = projectStepSummary(frame);
  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>{summary.stepTitle}</strong>
        <span className="chart-sub muted">{`${summary.inputLabel} → ${summary.outputLabel}`}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="36-bit docking bitmask gate">
        <text x={12} y={14} fontSize={10} fill="var(--muted)">Bit</text>
        <text x={12} y={38} fontSize={11} fontWeight={600} fill="var(--text)">Mask</text>
        <text x={12} y={72} fontSize={11} fontWeight={600} fill="var(--text)">Input</text>
        <text x={12} y={108} fontSize={11} fontWeight={600} fill="var(--text)">Output</text>
        {columns.map((col) => (
          <GateColumnCell key={col.index} col={col} />
        ))}
      </svg>
    </div>
  );
}
