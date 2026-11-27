import { useMemo } from 'react';
import { bigintLog2 } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import type { QuantumTraceFrame } from '../../shared';
import { DiracTrackSvg } from '../../shared/viz/DiracTrackSvg';
import { solver } from '../domain';

type TraceModel =
  | { readonly ok: true; readonly frames: readonly QuantumTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceModel(rawInput: string): TraceModel {
  try {
    const parsed = solver.parse(rawInput);
    return { ok: true, frames: solver.trace!(parsed) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatWinShare(wins: bigint, totalWins: bigint): string {
  if (totalWins <= 0n) return '0.0%';
  const permille = (wins * 1000n) / totalWins;
  return `${permille / 10n}.${permille % 10n}%`;
}

function peakLogScale(frames: readonly QuantumTraceFrame[]): number {
  const last = frames[frames.length - 1];
  if (last === undefined) return 1;
  const peak = last.p1Wins >= last.p2Wins ? last.p1Wins : last.p2Wins;
  return peak > 0n ? bigintLog2(peak + 1n) : 1;
}

function WinBar({
  label,
  wins,
  totalWins,
  maxLog,
  color,
}: {
  readonly label: string;
  readonly wins: bigint;
  readonly totalWins: bigint;
  readonly maxLog: number;
  readonly color: string;
}) {
  const pct = wins > 0n && maxLog > 0 ? Math.min(100, (bigintLog2(wins + 1n) / maxLog) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
        <span style={{ color }}>{label}</span>
        <span className="nowrap">{wins.toLocaleString()} ({formatWinShare(wins, totalWins)})</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} log2 win universes`}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: '10px', borderRadius: '999px', background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 120ms ease' }} />
      </div>
    </div>
  );
}

function QuantumWinBars({ frame, maxLog }: { readonly frame: QuantumTraceFrame; readonly maxLog: number }) {
  const totalWins = frame.p1Wins + frame.p2Wins;
  return (
    <div className="stack" style={{ gap: '0.55rem' }}>
      <WinBar label="Player 1 Wins" wins={frame.p1Wins} totalWins={totalWins} maxLog={maxLog} color="var(--accent)" />
      <WinBar label="Player 2 Wins" wins={frame.p2Wins} totalWins={totalWins} maxLog={maxLog} color="var(--warn)" />
    </div>
  );
}

function QuantumTelemetry({ frame }: { readonly frame: QuantumTraceFrame }) {
  const active = frame.activeUniverses;
  const done = active === 0n;
  const leadWins = frame.p1Wins >= frame.p2Wins ? frame.p1Wins : frame.p2Wins;
  const leader = frame.p1Wins >= frame.p2Wins ? 'P1' : 'P2';
  return (
    <div className="meta-row" aria-label="Quantum multiverse telemetry">
      <span className="badge">Round {frame.round}</span>
      <span className="badge">{frame.activePlayer === null ? 'Initial' : `P${frame.activePlayer} Split`}</span>
      <span className="badge nowrap">Active {active.toLocaleString()}</span>
      <span
        className="badge nowrap"
        style={{ borderColor: done ? 'var(--ok)' : 'var(--gold)', color: done ? 'var(--ok)' : 'var(--gold)' }}
      >
        {done ? `Winner ${leader} · ${leadWins.toLocaleString()}` : `Lead ${leader} · ${leadWins.toLocaleString()}`}
      </span>
    </div>
  );
}

/** Interactive visualizer for 2021 Day 21 Part 2 (Quantum 3-sided Dirac Dice). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  const model = useMemo(() => buildTraceModel(rawInput), [rawInput]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
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
      <QuantumTelemetry frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
      <QuantumWinBars frame={frame} maxLog={peakLogScale(frames)} />
      <DiracTrackSvg
        overlay={{
          kind: 'quantum',
          p1SpaceWeights: frame.p1SpaceWeights,
          p2SpaceWeights: frame.p2SpaceWeights,
          activePlayer: frame.activePlayer,
          p1Wins: frame.p1Wins,
          p2Wins: frame.p2Wins,
        }}
      />
    </div>
  );
}
