import type { CSSProperties, ReactNode } from 'react';
import {
  MAX_VISIBLE_SPARSE_CELLS,
  MAX_VISIBLE_TAPE_CELLS,
  classifyBoostCellRole,
  computeBoostTapeWindow,
  selectVisibleSparseEntries,
  type BoostCellRole,
  type BoostTraceFrame,
} from '../index';

interface SparseMemoryPanelProps {
  readonly frame: BoostTraceFrame;
}

const ROLE_STYLES: Readonly<Record<BoostCellRole, CSSProperties>> = {
  write: { border: '2px solid var(--ok)', background: 'var(--surface)', color: 'var(--text)' },
  ip: { border: '2px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)' },
  read: { border: '2px solid var(--gold)', background: 'var(--surface)', color: 'var(--text)' },
  param: { border: '1px dashed var(--accent)', background: 'var(--surface)', color: 'var(--text)' },
  idle: { border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' },
};

const ROLE_ACCENT: Readonly<Record<BoostCellRole, string>> = {
  write: 'var(--ok)',
  ip: 'var(--accent)',
  read: 'var(--gold)',
  param: 'var(--accent)',
  idle: 'var(--muted)',
};

function buildBaseCells(frame: BoostTraceFrame, start: number, end: number): ReactNode[] {
  const cells: ReactNode[] = [];
  for (let addr = start; addr < end; addr += 1) {
    const role = classifyBoostCellRole(addr, frame.step);
    cells.push(
      <div key={addr} style={{ ...ROLE_STYLES[role], borderRadius: 6, padding: '0.28rem 0.38rem', minWidth: 0, fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ fontSize: '0.68rem', color: ROLE_ACCENT[role], fontWeight: 600 }}>@{addr}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: role === 'idle' ? 500 : 700, overflowWrap: 'anywhere' }}>
          <code>{frame.memory[addr]!.toString()}</code>
        </div>
      </div>,
    );
  }
  return cells;
}

function buildSparseBadges(frame: BoostTraceFrame): ReactNode {
  const win = selectVisibleSparseEntries(frame.sparseEntries, frame.relativeBaseAfter, frame.step, MAX_VISIBLE_SPARSE_CELLS);
  if (win.entries.length === 0) {
    return <span className="muted">No non-zero sparse cells allocated</span>;
  }
  return win.entries.map((entry) => {
    const isWrite = frame.step.write !== null && frame.step.write.address === entry.address;
    const isRead = frame.step.reads.some((r) => r.address === entry.address);
    const borderColor = isWrite ? 'var(--ok)' : isRead ? 'var(--gold)' : 'var(--border)';
    return (
      <span key={entry.address.toString()} className="badge" style={{ borderColor, background: 'var(--surface)', color: 'var(--text)' }}>
        @{entry.address.toString()}: <code>{entry.value.toString()}</code>
      </span>
    );
  });
}

/** Displays bounded base memory tape and sparse high-address entries around RB/active writes. */
export function SparseMemoryPanel({ frame }: SparseMemoryPanelProps) {
  const win = computeBoostTapeWindow(frame.memory.length, Number(frame.step.ipBefore), MAX_VISIBLE_TAPE_CELLS);
  const cols = Math.min(win.end - win.start, 12);

  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header">
        <span>Memory ({frame.memory.length} base, {frame.sparseEntries.length} sparse)</span>
        {win.truncated && <span className="muted" style={{ fontSize: '0.8rem' }}>Base @{win.start}–@{win.end - 1}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '0.35rem', marginTop: '0.45rem' }}>
        {buildBaseCells(frame, win.start, win.end)}
      </div>
      <div className="meta-row" style={{ marginTop: '0.65rem', marginBottom: 0 }}>
        <span className="muted" style={{ fontSize: '0.82rem' }}>Sparse high cells:</span>
        {buildSparseBadges(frame)}
      </div>
    </section>
  );
}
