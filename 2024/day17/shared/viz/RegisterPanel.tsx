import type { CSSProperties } from 'react';
import type { VmRegisters } from '../types';

export interface RegisterPanelProps {
  readonly registers: VmRegisters;
  readonly prevRegisters: VmRegisters | null;
}

const GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: '0.65rem',
};

function cardStyle(changed: boolean): CSSProperties {
  return {
    background: 'var(--surface)',
    border: `1.5px solid ${changed ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 8,
    padding: '0.6rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    color: 'var(--text)',
  };
}

function formatThreeBitGroups(value: bigint): string {
  const bin = value.toString(2);
  const padded = bin.padStart(Math.ceil(bin.length / 3) * 3, '0');
  return padded.match(/.{3}/g)?.join(' ') ?? '000';
}

function RegisterCard({ name, value, changed }: { readonly name: 'A' | 'B' | 'C'; readonly value: bigint; readonly changed: boolean }) {
  const oct = value.toString(8);
  return (
    <div style={cardStyle(changed)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '0.85rem' }}>Register {name}</strong>
        {changed && <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>updated</span>}
      </div>
      <div className="nowrap" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
        <code>{value.toString()}</code>
      </div>
      <div className="nowrap" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        oct: <code style={{ color: 'var(--text)' }}>0o{oct.slice(0, -1)}<strong style={{ color: 'var(--gold)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{oct.slice(-1)}</strong></code>
      </div>
      <div style={{ fontSize: '0.76rem', color: 'var(--muted)', wordBreak: 'break-word' }}>
        bin: <code style={{ color: 'var(--text)' }}>{formatThreeBitGroups(value)}</code>
      </div>
    </div>
  );
}

/** Displays VM registers A, B, C in decimal, octal (low 3-bit digit highlighted), and 3-bit binary. */
export function RegisterPanel({ registers, prevRegisters }: RegisterPanelProps) {
  const entries: ReadonlyArray<readonly ['A' | 'B' | 'C', bigint, boolean]> = [
    ['A', registers.a, prevRegisters !== null && prevRegisters.a !== registers.a],
    ['B', registers.b, prevRegisters !== null && prevRegisters.b !== registers.b],
    ['C', registers.c, prevRegisters !== null && prevRegisters.c !== registers.c],
  ];
  return (
    <div style={GRID_STYLE}>
      {entries.map(([name, value, changed]) => (
        <RegisterCard key={name} name={name} value={value} changed={changed} />
      ))}
    </div>
  );
}
