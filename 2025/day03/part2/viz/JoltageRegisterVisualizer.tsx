import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, PART2_SELECTION_COUNT, solver, type BankDropFrame, type CellDisposition } from '../domain';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CELL_STYLE: Record<CellDisposition, { border: string; bg: string; tagColor: string; opacity: number; strike: boolean }> = {
  kept: { border: '2px solid var(--accent)', bg: 'color-mix(in srgb, var(--accent) 12%, var(--surface))', tagColor: 'var(--accent)', opacity: 1, strike: false },
  evicted: { border: '1px dashed var(--border)', bg: 'var(--surface)', tagColor: 'var(--muted)', opacity: 0.8, strike: true },
  truncated: { border: '1px solid var(--border)', bg: 'var(--surface)', tagColor: 'var(--muted)', opacity: 0.58, strike: false },
};
const boxBase: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, fontFamily: MONO, minWidth: 0, color: 'var(--text)',
};

export function JoltageRegisterVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(420);

  const traceState = useMemo(() => {
    try {
      const banks = solver.parse(rawInput);
      const frames = solver.trace!(banks, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      return { ok: true as const, frames, totalBanks: banks.length };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly BankDropFrame[] = traceState.ok ? traceState.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) { setIsPlaying(false); return frames.length - 1; }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;

  const clampedIndex = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clampedIndex]!;
  const bd = frame.breakdown;
  const slotByCell = new Map(bd?.selection.indices.map((cellIdx, s) => [cellIdx, s + 1]) ?? []);

  return (
    <div>
      <div className="meta-row">
        <span className="badge">
          Bank: <code>{frame.bankIndex !== null ? `${frame.bankIndex + 1} / ${traceState.totalBanks} (${bd!.selection.bank.length} cells)` : `Start (0 / ${traceState.totalBanks})`}</code>
        </span>
        <span className="badge">
          {bd ? <>Drops: <code>{bd.evictedCount} evicted + {bd.truncatedCount} trim / {bd.dropBudget} budget</code></> : 'Drops: none'}
        </span>
        {bd && <span className="badge status-solved"><code>+{bd.selection.joltage.toString()}</code></span>}
        <span className="badge">Total: <strong className="gold"><code>{frame.cumulativeJoltage.toString()}</code></strong></span>
        {traceState.totalBanks >= DEFAULT_MAX_TRACE_STEPS && (
          <span className="badge">Sampled {frames.length} / {traceState.totalBanks}</span>
        )}
      </div>

      {!bd ? (
        <p className="muted">Press Play or Next to inspect each bank&apos;s 12-digit register and stack drops.</p>
      ) : (
        <div style={{ margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PART2_SELECTION_COUNT}, minmax(0, 1fr))`, gap: '0.3rem', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
            {bd.selection.indices.map((cellIdx, s) => {
              const digit = bd.selection.bank.raw[cellIdx]!;
              return (
                <div key={s} title={`Slot #${s + 1} (10^${11 - s}): digit ${digit} @ cell ${cellIdx}`} aria-label={`Slot ${s + 1} 10^${11 - s}: digit ${digit} from cell ${cellIdx}`} style={{ ...boxBase, minHeight: 52, border: '1px solid var(--ok)', background: 'color-mix(in srgb, var(--ok) 10%, var(--surface))' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>10<sup>{11 - s}</sup></span>
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--ok)', lineHeight: 1.15 }}>{digit}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>@{cellIdx}</span>
                </div>
              );
            })}
          </div>

          <div className="meta-row" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            <span>Legend: <strong style={{ color: 'var(--accent)' }}>#1..#12</strong> kept</span>
            <span><code>pop</code> (strikethrough) evicted</span>
            <span><code>trim</code> tail truncated</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(30px, 1fr))', gap: '0.35rem', padding: '0.65rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
            {Array.from(bd.selection.bank.raw, (digit, idx) => {
              const disp = bd.dispositions[idx]!;
              const st = CELL_STYLE[disp];
              const slot = slotByCell.get(idx);
              const tag = slot ? `#${slot}` : disp === 'evicted' ? 'pop' : 'trim';
              const label = `Cell ${idx}: digit ${digit}, ${slot ? `kept #${slot}` : disp}`;
              return (
                <div key={idx} title={label} aria-label={label} style={{ ...boxBase, minHeight: 40, border: st.border, background: st.bg, opacity: st.opacity }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: slot ? 700 : 500, lineHeight: 1.1, textDecoration: st.strike ? 'line-through' : 'none' }}>{digit}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: st.tagColor }}>{tag}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PlaybackControls
        step={clampedIndex}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => { if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0); setIsPlaying((prev) => !prev); }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
