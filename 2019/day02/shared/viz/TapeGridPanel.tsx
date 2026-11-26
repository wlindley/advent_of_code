import type { CSSProperties, ReactNode } from 'react';
import {
  MAX_VISIBLE_TAPE_CELLS,
  classifyCellRole,
  computeTapeGridDimensions,
  computeTapeWindow,
  type AlarmTraceFrame,
  type CellRole,
} from '../index';

interface TapeGridPanelProps {
  readonly frame: AlarmTraceFrame;
}

const ROLE_STYLES: Readonly<Record<CellRole, CSSProperties>> = {
  write: { border: '2px solid var(--ok)', background: 'var(--surface)', color: 'var(--text)' },
  ip: { border: '2px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)' },
  read: { border: '2px solid var(--gold)', background: 'var(--surface)', color: 'var(--text)' },
  param: { border: '1px dashed var(--accent)', background: 'var(--surface)', color: 'var(--text)' },
  patched: { border: '1px solid var(--gold)', background: 'var(--bg)', color: 'var(--text)' },
  idle: { border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' },
};

const ROLE_BADGE_COLORS: Readonly<Record<CellRole, string>> = {
  write: 'var(--ok)',
  ip: 'var(--accent)',
  read: 'var(--gold)',
  param: 'var(--accent)',
  patched: 'var(--gold)',
  idle: 'var(--muted)',
};

const LEGEND_ITEMS: readonly { readonly role: CellRole; readonly label: string }[] = [
  { role: 'ip', label: 'IP' },
  { role: 'param', label: 'Param' },
  { role: 'read', label: 'Read' },
  { role: 'write', label: 'Write' },
  { role: 'patched', label: 'Patched (1,2)' },
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

function buildTapeCells(frame: AlarmTraceFrame, start: number, end: number): ReactNode[] {
  const cells: ReactNode[] = [];
  for (let addr = start; addr < end; addr += 1) {
    const role = classifyCellRole(addr, frame.step);
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
        <div style={{ fontSize: '0.7rem', color: ROLE_BADGE_COLORS[role], fontWeight: 600 }}>
          @{addr}
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: role === 'idle' ? 500 : 700, overflowWrap: 'anywhere' }}>
          <code>{value.toString()}</code>
        </div>
      </div>,
    );
  }
  return cells;
}

/** Light-mode responsive memory tape grid highlighting IP, operands, reads, and writes. */
export function TapeGridPanel({ frame }: TapeGridPanelProps) {
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${dims.columns}, minmax(0, 1fr))`,
          gap: '0.4rem',
          marginTop: '0.6rem',
        }}
      >
        {buildTapeCells(frame, win.start, win.end)}
      </div>
    </section>
  );
}
