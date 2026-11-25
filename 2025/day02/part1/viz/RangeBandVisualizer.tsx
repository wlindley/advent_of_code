import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type RangeScanFrame } from '../domain';

const BAR_WIDTH = 360;

function bandRatio(value: bigint, lo: bigint, span: bigint): number {
  return Number(((value - lo) * 1000n) / span) / 1000;
}

export function RangeBandVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(420);

  const traceState = useMemo(() => {
    try {
      const ranges = solver.parse(rawInput);
      const frames = solver.trace!(ranges, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      return { ok: true as const, frames, totalRanges: ranges.length };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly RangeScanFrame[] = traceState.ok ? traceState.frames : [];
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
  const hasHits = frame.rangeMatchCount > 0n;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Range: <code>{frame.range ? frame.range.label : 'Start'}</code></span>
        <span className={`badge ${hasHits ? 'status-solved' : ''}`}>
          Range Hits: <code>{frame.rangeMatchCount.toString()}</code>
          {hasHits && <> (<code>+{frame.rangeSum.toString()}</code>)</>}
        </span>
        <span className="badge">Total Sum: <strong className="gold"><code>{frame.cumulativeSum.toString()}</code></strong></span>
        {traceState.totalRanges >= DEFAULT_MAX_TRACE_STEPS && (
          <span className="muted">Sampled {frames.length} frames of {traceState.totalRanges} ranges</span>
        )}
      </div>

      {frame.range === null ? (
        <p className="muted">Press Play or Next to step through each ID range and see its clamped half-length bands.</p>
      ) : frame.bands.length === 0 ? (
        <p className="muted">
          Checked half-lengths <code>{frame.checkedHalfLengths.join(', ') || 'none (odd digits only)'}</code> — 0 doubled IDs in range.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0.75rem 0' }}>
          {frame.bands.map(({ band, samplePatterns }) => {
            const lo = 10n ** BigInt(band.patternLength - 1);
            const hi = lo * 10n - 1n;
            const span = hi - lo + 1n;
            const x1 = bandRatio(band.minPattern, lo, span) * BAR_WIDTH;
            const x2 = bandRatio(band.maxPattern + 1n, lo, span) * BAR_WIDTH;
            const w = Math.max(4, x2 - x1);
            const hiddenCount = band.count - BigInt(samplePatterns.length);
            const splitAt = Math.ceil(samplePatterns.length / 2);

            return (
              <div key={band.patternLength} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.65rem', background: 'var(--bg)' }}>
                <div className="meta-row" style={{ marginTop: 0 }}>
                  <span className="badge">k = {band.patternLength} (M = {band.multiplier.toString()})</span>
                  <span className="muted">
                    Clamped: <code>[{band.minPattern.toString()}..{band.maxPattern.toString()}]</code> in <code>[{lo.toString()}..{hi.toString()}]</code> · {band.count.toString()} hits
                  </span>
                </div>
                <svg
                  viewBox={`0 0 ${BAR_WIDTH} 22`}
                  width="100%"
                  height={22}
                  role="img"
                  aria-label={`Half-length ${band.patternLength} clamped to ${band.minPattern} through ${band.maxPattern} within ${lo} through ${hi}`}
                  style={{ display: 'block', margin: '0.35rem 0' }}
                >
                  <rect x={0} y={4} width={BAR_WIDTH} height={14} rx={4} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
                  <rect x={Math.min(x1, BAR_WIDTH - w)} y={4} width={w} height={14} rx={4} fill="var(--accent)" />
                </svg>
                <div className="meta-row" style={{ marginBottom: 0 }}>
                  {samplePatterns.map((p, idx) => {
                    const half = p.toString();
                    return (
                      <span key={`${p}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {hiddenCount > 0n && idx === splitAt && (
                          <span className="muted" style={{ fontSize: '0.82rem' }}>… +{hiddenCount.toString()} more …</span>
                        )}
                        <code className="badge" style={{ background: 'var(--surface)' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{half}</span>
                          <span aria-hidden="true" style={{ color: 'var(--muted)' }}>|</span>
                          <span style={{ color: 'var(--ok)', fontWeight: 700 }}>{half}</span>
                        </code>
                      </span>
                    );
                  })}
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
