import type { CSSProperties, ReactNode } from 'react';
import {
  MAX_VISIBLE_TAPE_CELLS,
  classifyDiagnosticCellRole,
  computeTapeGridDimensions,
  computeTapeWindow,
  type DiagnosticCellRole,
  type DiagnosticTraceFrame,
} from '../index';

interface MemoryWindowPanelProps {
  readonly frame: DiagnosticTraceFrame;
}

const ROLE_STYLES: Readonly<Record<DiagnosticCellRole, CSSProperties>> = {
  write: { border: '2px solid var(--ok)', background: 'var(--surface)', color: 'var(--text)' },
  ip: { border: '2px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)' },
  read: { border: '2px solid var(--gold)', background: 'var(--surface)', color: 'var(--text)' },
  param: { border: '1px dashed var(--accent)', background: 'var(--surface)', color: 'var(--text)' },
  idle: { border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' },
};

const ROLE_LABELS: Readonly<Record<DiagnosticCellRole, string>> = {
  write: 'var(--ok)',
  ip: 'var(--accent)',
  read: 'var(--gold)',
  param: 'var(--accent)',
  idle: 'var(--muted)',
};

const LEGEND_ITEMS: readonly { readonly role: DiagnosticCellRole; readonly label: string }[] = [
  { role: 'ip', label: 'IP' },
  { role: 'param', label: 'Param' },
  { role: 'read', label: 'Read' },
  { role: 'write', label: 'Write' },
];

function TapeLegend() {
  const items: ReactNode[] = [];
  for (const item of LEGEND_ITEMS) {
    items.push(
      <span key={item.role} className="badge" style={ROLE_STYLES[item.role]}>
        {item.label}
      </span>,
    );
  }
  return <div className="meta-row">{items}</div>;
}

function renderPinnedWriteCallout(frame: DiagnosticTraceFrame, start: number, end: number): ReactNode {
  const write = frame.step.write;
  if (write === null) return null;
  const addrNum = Number(write.address);
  if (addrNum >= start && addrNum < end) return null;
  return (
    <div
      className="badge"
      style={{
        border: '2px solid var(--ok)',
        background: 'var(--surface)',
        color: 'var(--text)',
        marginBottom: '0.5rem',
      }}
    >
      Off-window Write @{write.address.toString()}:{' '}
      <code>
        {write.previousValue.toString()} -&gt; {write.value.toString()}
      </code>
    </div>
  );
}

function buildTapeCells(frame: DiagnosticTraceFrame, start: number, end: number): ReactNode[] {
  const cells: ReactNode[] = [];
  for (let addr = start; addr < end; addr += 1) {
    const role = classifyDiagnosticCellRole(addr, frame.step);
    const value = frame.memory[addr]!;
    cells.push(
      <div
        key={addr}
        style={{
          ...ROLE_STYLES[role],
          borderRadius: 6,
          padding: '0.3rem 0.4rem',
          minWidth: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{ fontSize: '0.7rem', color: ROLE_LABELS[role], fontWeight: 600 }}>@{addr}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: role === 'idle' ? 500 : 700, overflowWrap: 'anywhere' }}>
          <code>{value.toString()}</code>
        </div>
      </div>,
    );
  }
  return cells;
}

/** Light-mode responsive memory window highlighting IP, arity-bounded params, reads, and writes. */
export function MemoryWindowPanel({ frame }: MemoryWindowPanelProps) {
  const focusIndex = Number(frame.step.ipBefore);
  const win = computeTapeWindow(frame.memory.length, focusIndex, MAX_VISIBLE_TAPE_CELLS);
  const dims = computeTapeGridDimensions(win.end - win.start, 12);

  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header">
        <span>Memory Tape ({frame.memory.length} cells)</span>
        {win.truncated && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Window @{win.start}–@{win.end - 1}
          </span>
        )}
      </div>
      <TapeLegend />
      {renderPinnedWriteCallout(frame, win.start, win.end)}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${dims.columns}, minmax(0, 1fr))`,
          gap: '0.4rem',
          marginTop: '0.5rem',
        }}
      >
        {buildTapeCells(frame, win.start, win.end)}
      </div>
    </section>
  );
}
