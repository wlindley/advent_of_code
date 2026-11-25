import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type BankSelectionFrame } from '../domain';

export function BatteryRackVisualizer({ rawInput }: VisualizerProps) {
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

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly BankSelectionFrame[] = traceState.ok ? traceState.frames : [];
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

  if (!traceState.ok) {
    return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  }

  const clampedIndex = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clampedIndex]!;
  const sel = frame.selection;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">
          Bank:{' '}
          <code>
            {frame.bankIndex !== null
              ? `${frame.bankIndex + 1} / ${traceState.totalBanks} (${sel!.bank.length} cells)`
              : `Start (0 / ${traceState.totalBanks})`}
          </code>
        </span>
        <span className={`badge ${sel ? 'status-solved' : ''}`}>
          {sel ? (
            <>
              Indices <code>[{sel.indices.join(', ')}]</code> · <code>+{sel.joltage.toString()}</code>
            </>
          ) : (
            'Selected: none'
          )}
        </span>
        <span className="badge">
          Total: <strong className="gold"><code>{frame.cumulativeJoltage.toString()}</code></strong>
        </span>
        {traceState.totalBanks >= DEFAULT_MAX_TRACE_STEPS && (
          <span className="badge">Sampled {frames.length} / {traceState.totalBanks}</span>
        )}
      </div>

      {!sel ? (
        <p className="muted">Press Play or Next to step through each battery bank and inspect its chosen pair.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))',
            gap: '0.35rem',
            margin: '0.75rem 0',
            padding: '0.65rem',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--bg)',
          }}
        >
          {Array.from(sel.bank.raw, (digit, idx) => {
            const slotIdx = sel.indices.indexOf(idx);
            const slot = slotIdx >= 0 ? slotIdx + 1 : null;
            const label = slot ? `Cell ${idx}: digit ${digit}, selected #${slot}` : `Cell ${idx}: digit ${digit}`;
            return (
              <div
                key={idx}
                title={label}
                aria-label={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 40,
                  borderRadius: 6,
                  border: slot ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: slot ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))' : 'var(--surface)',
                  color: 'var(--text)',
                  opacity: slot ? 1 : 0.62 + (Number(digit) - 1) * 0.045,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: slot ? 700 : 500, lineHeight: 1.1 }}>{digit}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: slot ? 'var(--accent)' : 'var(--muted)' }}>
                  {slot ? `#${slot}` : idx}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <PlaybackControls
        step={clampedIndex}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((prev) => !prev);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
