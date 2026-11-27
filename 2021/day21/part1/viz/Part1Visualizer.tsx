import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  DEFAULT_DETERMINISTIC_TARGET,
  DEFAULT_MAX_TRACE_STEPS,
  type DeterministicTurnFrame,
} from '../../shared';
import { DiracTrackSvg } from '../../shared/viz/DiracTrackSvg';
import { solver } from '../domain';

type TraceModel =
  | { readonly ok: true; readonly frames: readonly DeterministicTurnFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceModel(rawInput: string): TraceModel {
  try {
    const parsed = solver.parse(rawInput);
    const frames = solver.trace!(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ScoreBar({
  label,
  score,
  space,
  color,
}: {
  readonly label: string;
  readonly score: number;
  readonly space: number;
  readonly color: string;
}) {
  const pct = Math.min(100, (score / DEFAULT_DETERMINISTIC_TARGET) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
        <span style={{ color }}>{label} (Space {space})</span>
        <span className="nowrap">{score} / {DEFAULT_DETERMINISTIC_TARGET}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={DEFAULT_DETERMINISTIC_TARGET}
        style={{
          height: '10px',
          borderRadius: '999px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 120ms ease' }} />
      </div>
    </div>
  );
}

function TelemetryBadges({ frame }: { readonly frame: DeterministicTurnFrame }) {
  const isFinished = frame.winner !== null;
  return (
    <div className="meta-row" aria-label="Deterministic turn telemetry">
      <span className="badge">Turn {frame.turn}</span>
      <span className="badge">Die Rolls {frame.rollCount}</span>
      <span className="badge">
        Roll Sum {frame.rolls === null ? '—' : `${frame.rollSum} (${frame.rolls.join('+')})`}
      </span>
      <span
        className="badge"
        style={{
          borderColor: isFinished ? 'var(--ok)' : 'var(--gold)',
          color: isFinished ? 'var(--ok)' : 'var(--gold)',
        }}
      >
        {isFinished ? `Winner P${frame.winner} · Answer ${frame.product}` : `Product ${frame.product}`}
      </span>
    </div>
  );
}

/** Interactive visualizer for 2021 Day 21 Part 1 (Deterministic 100-sided Dirac Dice). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  const model = useMemo(() => buildTraceModel(rawInput), [rawInput]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const frame = frames[playback.step] ?? null;

  if (!model.ok || frame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize Dirac Dice: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <TelemetryBadges frame={frame} />
        <PlaybackControls
          step={playback.step}
          totalSteps={frames.length}
          isPlaying={playback.isPlaying}
          speedMs={playback.speedMs}
          onTogglePlay={playback.togglePlay}
          onStepChange={playback.setStep}
          onSpeedChange={playback.setSpeedMs}
        />
        <div className="stack" style={{ gap: '0.55rem', marginTop: '0.25rem' }}>
          <ScoreBar label="Player 1" score={frame.p1Score} space={frame.p1Pos} color="var(--accent)" />
          <ScoreBar label="Player 2" score={frame.p2Score} space={frame.p2Pos} color="var(--warn)" />
        </div>
      </div>
      <div className="card" style={{ marginBottom: 0 }}>
        <DiracTrackSvg
          overlay={{
            kind: 'deterministic',
            p1Pos: frame.p1Pos,
            p2Pos: frame.p2Pos,
            activePlayer: frame.activePlayer,
            winner: frame.winner,
            rolls: frame.rolls,
          }}
        />
      </div>
    </div>
  );
}
