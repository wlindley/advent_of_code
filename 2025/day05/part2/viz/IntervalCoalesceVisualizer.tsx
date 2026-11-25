import { useEffect, useMemo, useState } from 'react';
import type { ClosedInterval } from '../../../../shared/core';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type CoalesceAction, type IntervalCoalesceFrame } from '../domain';

const SVG_W = 640;
const PAD_X = 20;
const TRACK_W = SVG_W - PAD_X * 2;
const ACTION_COLORS: Record<CoalesceAction, string> = {
  new: 'var(--accent)', extend: 'var(--ok)', touch: 'var(--gold)', absorbed: 'var(--err)',
};

export function IntervalCoalesceVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(260);

  const state = useMemo(() => {
    try {
      const db = solver.parse(rawInput);
      const frames = solver.trace!(db, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      const finalMerged = frames.at(-1)?.mergedIntervals ?? [];
      const domainMin = finalMerged[0]?.start ?? 0n;
      const domainMax = finalMerged.at(-1)?.end ?? domainMin;
      return { ok: true as const, frames, rawRangeCount: db.freshRanges.length, domainMin, span: domainMax - domainMin };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly IntervalCoalesceFrame[] = state.ok ? state.frames : [];
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

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const clampedIndex = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clampedIndex]!;
  const project = (val: bigint) =>
    state.span === 0n ? 0.5 : Number(((val - state.domainMin) * 10000n) / state.span) / 10000;
  const toX = (val: bigint) => PAD_X + project(val) * TRACK_W;
  const boundsOf = (iv: ClosedInterval) => {
    const x1 = toX(iv.start);
    const w = Math.max(3, toX(iv.end) - x1);
    return { x: Math.min(x1, SVG_W - PAD_X - w), w };
  };

  const actionColor = frame.action ? ACTION_COLORS[frame.action] : 'var(--accent)';
  const activeBox = frame.activeInterval ? boundsOf(frame.activeInterval) : null;
  const rightmostMerged = frame.mergedIntervals.at(-1);
  const rightBox = rightmostMerged ? boundsOf(rightmostMerged) : null;
  const overlapEliminated = frame.rawSum - frame.unionTotal;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">
          {frame.activeInterval
            ? <>Step <code>#{frame.step}/{state.rawRangeCount}</code> · <code>[{frame.activeInterval.start}–{frame.activeInterval.end}]</code></>
            : <>Ready <code>(0 / {state.rawRangeCount})</code></>}
        </span>
        {frame.action && (
          <span className="badge" style={{ borderColor: actionColor, color: actionColor }}>
            {frame.action.toUpperCase()}
          </span>
        )}
        <span className="badge">Bands: <code>{frame.mergedIntervals.length} / {state.rawRangeCount}</code></span>
        <span className="badge status-solved">
          Union IDs: <strong className="gold"><code>{frame.unionTotal.toString()}</code></strong>
        </span>
        <span className="badge">Overlap Eliminated: <code>{overlapEliminated.toString()}</code></span>
        {state.rawRangeCount + 1 > DEFAULT_MAX_TRACE_STEPS && (
          <span className="badge">Sampled {frames.length} / {state.rawRangeCount + 1}</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} 108`}
        role="img"
        aria-label={`Sorted interval coalescing step ${frame.step} with ${frame.mergedIntervals.length} merged bands`}
        style={{
          width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0',
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
        }}
      >
        <line x1={PAD_X} y1={26} x2={SVG_W - PAD_X} y2={26} stroke="var(--border)" strokeWidth={1.25} strokeDasharray="4 4" />
        <line x1={PAD_X} y1={68} x2={SVG_W - PAD_X} y2={68} stroke="var(--border)" strokeWidth={2} />
        {activeBox && rightBox && (
          <line
            x1={activeBox.x + activeBox.w / 2} y1={36}
            x2={rightBox.x + rightBox.w / 2} y2={58}
            stroke={actionColor} strokeWidth={1.5} strokeDasharray="3 3"
          />
        )}
        {activeBox && (
          <rect
            x={activeBox.x} y={16} width={activeBox.w} height={20} rx={3}
            fill={actionColor} fillOpacity={0.28} stroke={actionColor} strokeWidth={2}
          />
        )}
        {frame.mergedIntervals.map((iv, idx) => {
          const { x, w } = boundsOf(iv);
          const isTarget = idx === frame.mergedIntervals.length - 1 && frame.action !== null;
          const color = isTarget ? actionColor : 'var(--accent)';
          return (
            <rect
              key={`${iv.start}-${iv.end}`} x={x} y={58} width={w} height={20} rx={3}
              fill={color} fillOpacity={isTarget ? 0.35 : 0.22} stroke={color} strokeWidth={isTarget ? 2.5 : 1.25}
            />
          );
        })}
        <text x={PAD_X} y={98} fontSize={11} fill="var(--text)">{state.domainMin.toString()}</text>
        <text x={SVG_W - PAD_X} y={98} fontSize={11} textAnchor="end" fill="var(--text)">
          {(state.domainMin + state.span).toString()}
        </text>
      </svg>

      <PlaybackControls
        step={clampedIndex}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((p) => !p);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
