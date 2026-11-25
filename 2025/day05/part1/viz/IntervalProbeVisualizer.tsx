import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type IntervalProbeFrame } from '../domain';

const SVG_W = 640;
const PAD_X = 20;
const TRACK_W = SVG_W - PAD_X * 2;

export function IntervalProbeVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(220);

  const state = useMemo(() => {
    try {
      const db = solver.parse(rawInput);
      const frames = solver.trace!(db, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      const merged = frames[0]?.mergedIntervals ?? [];
      let domainMin = merged[0]?.start ?? db.availableIds[0] ?? 0n;
      let domainMax = merged.at(-1)?.end ?? domainMin;
      for (const id of db.availableIds) {
        if (id < domainMin) domainMin = id;
        if (id > domainMax) domainMax = id;
      }
      return {
        ok: true as const,
        frames,
        rawRangeCount: db.freshRanges.length,
        totalQueries: db.availableIds.length,
        domainMin,
        span: domainMax - domainMin,
      };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly IntervalProbeFrame[] = state.ok ? state.frames : [];
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

  const clampedIndex = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clampedIndex]!;
  const project = (val: bigint) =>
    state.span === 0n ? 0.5 : Number(((val - state.domainMin) * 10000n) / state.span) / 10000;
  const toX = (val: bigint) => PAD_X + project(val) * TRACK_W;

  const probed = frame.queryIndex !== null ? frame.queryIndex + 1 : 0;
  const spoiledCount = probed - frame.freshCount;
  const isFresh = frame.matchedInterval !== null;
  const probeX = frame.queryId !== null ? toX(frame.queryId) : null;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">
          Ranges: <code>{frame.mergedIntervals.length} merged / {state.rawRangeCount} raw</code>
        </span>
        <span className="badge">
          {frame.queryIndex !== null
            ? <>Query <code>#{frame.queryIndex + 1}</code> · ID <code>{frame.queryId!.toString()}</code></>
            : <>Ready <code>(0 / {state.totalQueries})</code></>}
        </span>
        {frame.queryIndex !== null && (
          <span className={`badge ${isFresh ? 'status-solved' : 'status-blocked'}`}>
            {isFresh ? `FRESH [${frame.matchedInterval!.start}–${frame.matchedInterval!.end}]` : 'SPOILED'}
          </span>
        )}
        <span className="badge status-solved">Fresh: <strong className="gold"><code>{frame.freshCount}</code></strong></span>
        <span className="badge">Spoiled: <code>{spoiledCount}</code></span>
        {state.totalQueries + 1 > DEFAULT_MAX_TRACE_STEPS && (
          <span className="badge">Sampled {frames.length} / {state.totalQueries + 1}</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} 84`}
        role="img"
        aria-label={`Merged fresh intervals (${frame.mergedIntervals.length}) and active ID probe`}
        style={{
          width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0',
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
        }}
      >
        <line x1={PAD_X} y1={48} x2={SVG_W - PAD_X} y2={48} stroke="var(--border)" strokeWidth={2} />
        {frame.mergedIntervals.map((iv) => {
          const x1 = toX(iv.start);
          const w = Math.max(3, toX(iv.end) - x1);
          const x = Math.min(x1, SVG_W - PAD_X - w);
          const hit = iv === frame.matchedInterval;
          return (
            <rect
              key={`${iv.start}-${iv.end}`}
              x={x}
              y={38}
              width={w}
              height={20}
              rx={3}
              fill={hit ? 'var(--ok)' : 'var(--accent)'}
              fillOpacity={hit ? 0.35 : 0.22}
              stroke={hit ? 'var(--ok)' : 'var(--accent)'}
              strokeWidth={hit ? 2.5 : 1.25}
            />
          );
        })}
        {probeX !== null && (
          <g>
            <line x1={probeX} y1={14} x2={probeX} y2={70} stroke={isFresh ? 'var(--ok)' : 'var(--err)'} strokeWidth={2} />
            <circle cx={probeX} cy={14} r={4.5} fill={isFresh ? 'var(--ok)' : 'var(--err)'} />
          </g>
        )}
        <text x={PAD_X} y={76} fontSize={11} fill="var(--text)">{state.domainMin.toString()}</text>
        <text x={SVG_W - PAD_X} y={76} fontSize={11} textAnchor="end" fill="var(--text)">
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
