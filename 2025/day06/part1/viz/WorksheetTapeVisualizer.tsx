import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type ProblemEvalFrame } from '../domain';

const WINDOW_SIZE = 7;

export function WorksheetTapeVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(260);

  const state = useMemo(() => {
    try {
      const worksheet = solver.parse(rawInput);
      const frames = solver.trace!(worksheet, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      return { ok: true as const, blocks: worksheet.blocks, frames };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly ProblemEvalFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) {
          setIsPlaying(false);
          return frames.length - 1;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const clamped = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clamped]!;
  const total = state.blocks.length;
  const activeIdx = frame.problemIndex ?? 0;
  const start = Math.max(0, Math.min(activeIdx - Math.floor(WINDOW_SIZE / 2), Math.max(0, total - WINDOW_SIZE)));
  const end = Math.min(total, start + WINDOW_SIZE);
  const visible = state.blocks.slice(start, end);
  const opSym = frame.block?.operator === '*' ? '×' : '+';

  return (
    <div>
      <div className="meta-row">
        <span className="badge">
          {frame.problemIndex !== null
            ? <>Problem <code>#{frame.problemIndex + 1} / {total}</code></>
            : <>Ready <code>(0 / {total})</code></>}
        </span>
        {frame.block && (
          <>
            <span className="badge">{frame.block.operator === '+' ? '+ ADD' : '× MUL'}</span>
            <span className="badge">Cols <code>{frame.block.startCol}–{frame.block.endCol}</code></span>
          </>
        )}
        <span className="badge status-solved">
          Grand Total: <strong className="gold"><code>{frame.grandTotal.toString()}</code></strong>
        </span>
        {total + 1 > DEFAULT_MAX_TRACE_STEPS && (
          <span className="badge">Sampled {frames.length} / {total + 1}</span>
        )}
      </div>

      <div
        role="region"
        aria-label="Worksheet problem tape window"
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '0.5rem',
          padding: '0.75rem', margin: '0.6rem 0', border: '1px solid var(--border)',
          borderRadius: 8, background: 'var(--bg)', color: 'var(--text)',
        }}
      >
        {start > 0 && <span className="badge muted" style={{ alignSelf: 'center' }}>… {start} earlier</span>}
        {visible.map((block, offset) => {
          const idx = start + offset;
          const isActive = frame.problemIndex === idx;
          const isDone = frame.problemIndex !== null && idx < frame.problemIndex;
          const borderColor = isActive ? 'var(--accent)' : isDone ? 'var(--ok)' : 'var(--border)';
          return (
            <div
              key={`${block.startCol}-${block.endCol}`}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: 6,
                background: 'var(--surface)',
                border: `${isActive ? 2 : 1}px solid ${borderColor}`,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.9rem',
                lineHeight: 1.35,
              }}
            >
              <div className="muted" style={{ fontSize: '0.7rem', marginBottom: 2 }}>#{idx + 1}</div>
              {block.digitRows.map((row, r) => (
                <div key={r} style={{ whiteSpace: 'pre' }}>{row}</div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 2, fontWeight: 700, color: borderColor === 'var(--border)' ? 'var(--text)' : borderColor }}>
                {block.operator}
              </div>
            </div>
          );
        })}
        {end < total && <span className="badge muted" style={{ alignSelf: 'center' }}>… {total - end} more</span>}
      </div>

      <p style={{ margin: '0.4rem 0', minHeight: '1.5em' }}>
        {frame.block !== null ? (
          <code>
            {frame.operands.map((v) => v.toString()).join(` ${opSym} `)} = {frame.problemResult!.toString()}
          </code>
        ) : (
          <span className="muted">Step through each vertical problem block to compute the grand total.</span>
        )}
      </p>

      <PlaybackControls
        step={clamped}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && clamped >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((p) => !p);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
