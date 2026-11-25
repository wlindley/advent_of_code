import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DIAL_SIZE } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type DialTraceFrame } from '../domain';

const CX = 130;
const CY = 130;
const TICKS = Array.from({ length: DIAL_SIZE }, (_, i) => i);

function polar(radius: number, value: number): readonly [number, number] {
  const angle = (value / DIAL_SIZE) * Math.PI * 2 - Math.PI / 2;
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function renderSweepArc(frame: DialTraceFrame) {
  if (!frame.rotation) return null;
  const step = frame.rotation.distance % DIAL_SIZE;
  if (step === 0) {
    return <circle cx={CX} cy={CY} r={63} fill="none" stroke="var(--accent)" strokeWidth={3} opacity={0.65} />;
  }
  const [sx, sy] = polar(63, frame.fromPosition);
  const [ex, ey] = polar(63, frame.toPosition);
  const largeArc = step > DIAL_SIZE / 2 ? 1 : 0;
  const sweep = frame.rotation.direction === 'R' ? 1 : 0;
  const d = `M ${sx} ${sy} A 63 63 0 ${largeArc} ${sweep} ${ex} ${ey}`;
  return <path d={d} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />;
}

export function DialVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(360);

  const traceState = useMemo(() => {
    try {
      const rotations = solver.parse(rawInput);
      const frames = solver.trace!(rotations, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      return { ok: true as const, frames, totalRotations: rotations.length };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, [rawInput]);

  const frames: readonly DialTraceFrame[] = traceState.ok ? traceState.frames : [];
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
  const isZeroHit = frame.rotation !== null && frame.toPosition === 0;
  const zeroColor = isZeroHit ? 'var(--ok)' : 'var(--gold)';
  const [nx, ny] = polar(56, frame.toPosition);

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Instruction: {frame.rotation ? frame.rotation.label : 'Start'}</span>
        <span className="badge">Dial: {frame.fromPosition} → {frame.toPosition}</span>
        <span className={`badge ${isZeroHit ? 'status-solved' : ''}`}>Zero Hits: {frame.zeroCount}</span>
        {traceState.totalRotations >= DEFAULT_MAX_TRACE_STEPS && (
          <span className="muted">Sampled {frames.length} frames of {traceState.totalRotations} rotations</span>
        )}
      </div>
      <svg
        viewBox="0 0 260 260"
        width={260}
        height={260}
        role="img"
        aria-label={`Safe dial at position ${frame.toPosition}, zero hits ${frame.zeroCount}`}
        style={{ display: 'block', margin: '0.5rem auto', maxWidth: '100%' }}
      >
        {frame.rotation && frame.rotation.distance >= DIAL_SIZE && (
          <circle cx={CX} cy={CY} r={116} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" opacity={0.65} />
        )}
        <circle cx={CX} cy={CY} r={104} fill="var(--bg)" stroke="var(--border)" strokeWidth={2} />
        {TICKS.map((tick) => {
          const isMajor = tick % 10 === 0;
          const [x1, y1] = polar(isMajor ? 93 : 99, tick);
          const [x2, y2] = polar(104, tick);
          const [lx, ly] = polar(79, tick);
          return (
            <g key={tick}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={tick === 0 ? zeroColor : isMajor ? 'var(--text)' : 'var(--border)'}
                strokeWidth={isMajor ? 2 : 1}
              />
              {isMajor && (
                <text
                  x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fontWeight={tick === 0 ? 700 : 500}
                  fill={tick === 0 ? zeroColor : 'var(--muted)'}
                >{tick}</text>
              )}
            </g>
          );
        })}
        {renderSweepArc(frame)}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={isZeroHit ? 'var(--ok)' : 'var(--accent)'} strokeWidth={3} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={22} fill="var(--surface)" stroke={isZeroHit ? 'var(--ok)' : 'var(--border)'} strokeWidth={2} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill={isZeroHit ? 'var(--ok)' : 'var(--text)'}>
          {frame.toPosition}
        </text>
      </svg>
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
