import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type RangeInclusionFrame } from '../domain';

const BAR_WIDTH = 360;

function bandRatio(value: bigint, lo: bigint, span: bigint): number {
  return Number(((value - lo) * 1000n) / span) / 1000;
}

function PatternPreview({ pattern, repeats, isAdd }: { pattern: string; repeats: number; isAdd: boolean }) {
  const shown = repeats > 10 ? 2 : repeats;
  const colorA = isAdd ? 'var(--accent)' : 'var(--err)';
  const colorB = isAdd ? 'var(--ok)' : 'var(--text)';
  return (
    <code className="badge" style={{ background: 'var(--surface)' }}>
      {Array.from({ length: shown }, (_, i) => (
        <span key={i}>
          {i > 0 && <span aria-hidden="true" style={{ color: 'var(--muted)' }}>|</span>}
          <span style={{ color: i % 2 === 0 ? colorA : colorB, fontWeight: 700 }}>{pattern}</span>
        </span>
      ))}
      {repeats > 10 && <span style={{ color: 'var(--muted)' }}>|… (×{repeats})</span>}
    </code>
  );
}

export function InclusionBandVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(420);

  const traceState = useMemo(() => {
    try {
      const ranges = solver.parse(rawInput);
      return { ok: true as const, frames: solver.trace!(ranges, { maxSteps: DEFAULT_MAX_TRACE_STEPS }), totalRanges: ranges.length };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly RangeInclusionFrame[] = traceState.ok ? traceState.frames : [];
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
  const hasHits = frame.rangeMatchCount > 0n;
  const hasCancel = frame.bands.some((b) => b.sign < 0n);
  const addedSum = frame.bands.reduce((acc, b) => (b.sign > 0n ? acc + b.band.sum : acc), 0n);
  const subSum = frame.bands.reduce((acc, b) => (b.sign < 0n ? acc + b.band.sum : acc), 0n);

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Range: <code>{frame.range ? frame.range.label : 'Start'}</code></span>
        <span className={`badge ${hasHits ? 'status-solved' : ''}`}>
          Net Range Hits: <code>{frame.rangeMatchCount.toString()}</code>
          {hasHits && <> (<code>+{frame.rangeSum.toString()}</code>)</>}
        </span>
        <span className="badge">Total Sum: <strong className="gold"><code>{frame.cumulativeSum.toString()}</code></strong></span>
        {traceState.totalRanges >= DEFAULT_MAX_TRACE_STEPS && (
          <span className="muted">Sampled {frames.length} frames of {traceState.totalRanges} ranges</span>
        )}
      </div>

      {hasCancel && (
        <div className="meta-row" style={{ marginTop: 0 }}>
          <span className="badge" style={{ background: 'var(--surface)' }}>
            Möbius Net: <code style={{ color: 'var(--accent)' }}>+{addedSum.toString()}</code> − <code style={{ color: 'var(--err)' }}>{subSum.toString()}</code> = <strong><code>{frame.rangeSum.toString()}</code></strong>
          </span>
        </div>
      )}

      {frame.range === null ? (
        <p className="muted">Press Play or Next to inspect each range and its signed Möbius inclusion-exclusion bands.</p>
      ) : frame.bands.length === 0 ? (
        <p className="muted">
          Checked digit lengths <code>{frame.checkedDigitLengths.join(', ') || 'none (1-digit only)'}</code> — 0 periodic IDs in range.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', margin: '0.75rem 0' }}>
          {frame.bands.map(({ band, sign, samplePatterns }) => {
            const isAdd = sign > 0n;
            const lo = 10n ** BigInt(band.patternLength - 1);
            const hi = lo * 10n - 1n;
            const x1 = bandRatio(band.minPattern, lo, hi - lo + 1n) * BAR_WIDTH;
            const x2 = bandRatio(band.maxPattern + 1n, lo, hi - lo + 1n) * BAR_WIDTH;
            const w = Math.max(4, x2 - x1);
            const hiddenCount = band.count - BigInt(samplePatterns.length);
            const splitAt = Math.ceil(samplePatterns.length / 2);
            const signChar = isAdd ? '+' : '−';
            const tone = isAdd ? 'var(--accent)' : 'var(--err)';

            return (
              <div key={`${band.digitLength}-${band.patternLength}-${band.repeats}`} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.65rem', background: 'var(--bg)' }}>
                <div className="meta-row" style={{ marginTop: 0 }}>
                  <span className="badge" style={{ borderColor: tone, color: tone }}>{isAdd ? '+ Add' : '− Cancel'}</span>
                  <span className="badge">L={band.digitLength}={band.patternLength}×{band.repeats} (M={band.multiplier.toString()})</span>
                  <span className="muted">
                    Clamped: <code>[{band.minPattern.toString()}..{band.maxPattern.toString()}]</code> · <code>{signChar}{band.count.toString()}</code> hits (<code>{signChar}{band.sum.toString()}</code>)
                  </span>
                </div>
                <svg viewBox={`0 0 ${BAR_WIDTH} 22`} width="100%" height={22} role="img" aria-label={`Digit length ${band.digitLength}, ${band.patternLength} by ${band.repeats} ${isAdd ? 'add' : 'cancel'} band clamped to ${band.minPattern} through ${band.maxPattern}`} style={{ display: 'block', margin: '0.35rem 0' }}>
                  <rect x={0} y={4} width={BAR_WIDTH} height={14} rx={4} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
                  <rect x={Math.min(x1, BAR_WIDTH - w)} y={4} width={w} height={14} rx={4} fill={tone} />
                </svg>
                <div className="meta-row" style={{ marginBottom: 0 }}>
                  {samplePatterns.map((p, idx) => (
                    <span key={`${p}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      {hiddenCount > 0n && idx === splitAt && <span className="muted" style={{ fontSize: '0.82rem' }}>… +{hiddenCount.toString()} more …</span>}
                      <PatternPreview pattern={p.toString()} repeats={band.repeats} isAdd={isAdd} />
                    </span>
                  ))}
                </div>
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
        onTogglePlay={() => { if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0); setIsPlaying((prev) => !prev); }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
