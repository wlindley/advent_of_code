import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DIAL_SIZE } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, DialClickTraceFrame, solver } from '../domain';

const CX = 140;
const CY = 140;
const TICKS = Array.from({ length: DIAL_SIZE }, (_, i) => i);

function polar(radius: number, value: number): readonly [number, number] {
  const angle = (value / DIAL_SIZE) * Math.PI * 2 - Math.PI / 2;
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function renderSpiralAndSparks(frame: DialClickTraceFrame) {
  if (!frame.rotation) return null;
  const { direction, distance } = frame.rotation;
  const visualDist = Math.min(frame.fullTurns, 4) * DIAL_SIZE + (distance % DIAL_SIZE);
  const dirSign = direction === 'R' ? 1 : -1;
  const points: string[] = [];
  for (let k = 0; k < visualDist; k += 4) {
    const [x, y] = polar(34 + (32 * k) / visualDist, frame.fromPosition + dirSign * k);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const [ex, ey] = polar(66, frame.fromPosition + dirSign * visualDist);
  points.push(`${ex.toFixed(1)},${ey.toFixed(1)}`);

  const firstHit =
    direction === 'R' ? DIAL_SIZE - frame.fromPosition : frame.fromPosition === 0 ? DIAL_SIZE : frame.fromPosition;
  const sparks: Array<{ readonly k: number; readonly y: number; readonly isLand: boolean }> = [];
  for (let k = firstHit; k <= visualDist; k += DIAL_SIZE) {
    sparks.push({ k, y: CY - (34 + (32 * k) / visualDist), isLand: k === visualDist && frame.landedOnZero });
  }
  const stroke = frame.midRotationHits > 0 ? 'var(--warn)' : frame.landedOnZero ? 'var(--ok)' : 'var(--accent)';

  return (
    <g>
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      {sparks.map((s) => (
        <circle key={s.k} cx={CX} cy={s.y} r={3.5} fill={s.isLand ? 'var(--ok)' : 'var(--warn)'} stroke="var(--surface)" strokeWidth={1.2} />
      ))}
    </g>
  );
}

function hitTag(frame: DialClickTraceFrame): string | null {
  if (frame.midRotationHits > 0 && frame.landedOnZero) return 'pass + landed';
  if (frame.midRotationHits > 0) return 'pass-through';
  return frame.landedOnZero ? 'landed' : null;
}

export function ClickDialVisualizer({ rawInput }: VisualizerProps) {
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

  const frames: readonly DialClickTraceFrame[] = traceState.ok ? traceState.frames : [];
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
  const gateColor = frame.landedOnZero ? 'var(--ok)' : frame.midRotationHits > 0 ? 'var(--warn)' : 'var(--gold)';
  const needleColor = frame.landedOnZero ? 'var(--ok)' : frame.midRotationHits > 0 ? 'var(--warn)' : 'var(--accent)';
  const [nx, ny] = polar(60, frame.toPosition);
  const tag = hitTag(frame);

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Step {frame.step}: {frame.rotation ? frame.rotation.label : 'Start'}</span>
        <span className="badge">{frame.fromPosition} → {frame.toPosition}</span>
        <span className={`badge ${frame.stepZeroHits > 0 ? 'status-solved' : ''}`}>
          Step Hits: +{frame.stepZeroHits}{tag ? ` (${tag})` : ''}
        </span>
        <span className="badge">Total Zero Clicks: {frame.totalZeroHits}</span>
        {frame.fullTurns > 0 && <span className="badge">{frame.fullTurns} full turn{frame.fullTurns > 1 ? 's' : ''}</span>}
        {traceState.totalRotations >= DEFAULT_MAX_TRACE_STEPS && (
          <span className="muted">Sampled {frames.length} frames of {traceState.totalRotations} rotations</span>
        )}
      </div>
      <svg
        viewBox="0 0 280 280" width={280} height={280} role="img"
        aria-label={`Safe dial at position ${frame.toPosition}, total zero clicks ${frame.totalZeroHits}`}
        style={{ display: 'block', margin: '0.5rem auto', maxWidth: '100%' }}
      >
        <circle cx={CX} cy={CY} r={104} fill="var(--bg)" stroke="var(--border)" strokeWidth={2} />
        <line x1={CX - 12} y1={CY - 114} x2={CX + 12} y2={CY - 114} stroke={gateColor} strokeWidth={4} strokeLinecap="round" />
        {frame.stepZeroHits > 0 && (
          <text x={CX + 18} y={CY - 114} dominantBaseline="central" fontSize={12} fontWeight={700} fill={gateColor}>+{frame.stepZeroHits}</text>
        )}
        {TICKS.map((tick) => {
          const isMajor = tick % 10 === 0;
          const [x1, y1] = polar(isMajor ? 93 : 99, tick);
          const [x2, y2] = polar(104, tick);
          const [lx, ly] = polar(79, tick);
          return (
            <g key={tick}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tick === 0 ? gateColor : isMajor ? 'var(--text)' : 'var(--border)'} strokeWidth={tick === 0 ? 3 : isMajor ? 2 : 1} />
              {isMajor && (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={tick === 0 ? 700 : 500} fill={tick === 0 ? gateColor : 'var(--muted)'}>
                  {tick}
                </text>
              )}
            </g>
          );
        })}
        {renderSpiralAndSparks(frame)}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={needleColor} strokeWidth={3} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={22} fill="var(--surface)" stroke={gateColor} strokeWidth={2} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill={frame.landedOnZero ? 'var(--ok)' : 'var(--text)'}>
          {frame.toPosition}
        </text>
      </svg>
      <PlaybackControls
        step={clampedIndex} totalSteps={frames.length} isPlaying={isPlaying} speedMs={speedMs}
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
