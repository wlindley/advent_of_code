import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  type CheatConfig,
  type RaceConditionSnapshot,
  buildCheatTrace,
  parseRacetrack,
} from '../index';
import { RacetrackCanvas } from './RacetrackCanvas';
import { SavingHistogram } from './SavingHistogram';

export interface RaceConditionVisualizerProps {
  readonly rawInput: string;
  readonly config: CheatConfig;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly RaceConditionSnapshot[] }
  | { readonly ok: false; readonly message: string };

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Wall', '#1e293b'],
  ['Track (S→E)', '#7dd3fc'],
  ['Start S', '#059669'],
  ['End E', '#e11d48'],
  ['Cheat diamond', 'rgba(9, 105, 218, 0.35)'],
  ['Cheat jump', '#d97706'],
];

function buildTraceState(rawInput: string, config: CheatConfig): TraceState {
  try {
    const track = parseRacetrack(rawInput);
    return { ok: true, frames: buildCheatTrace(track, config) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatJump(snapshot: RaceConditionSnapshot): string {
  const cheat = snapshot.activeCheat;
  if (!cheat) return '—';
  return `(${cheat.start.row},${cheat.start.col})→(${cheat.end.row},${cheat.end.col}) d=${cheat.duration} (+${cheat.saving})`;
}

function RaceHud({ snapshot }: { readonly snapshot: RaceConditionSnapshot }) {
  const track = snapshot.field.racetrack;
  const isComplete = snapshot.phase === 'complete';
  const phaseColor = isComplete ? 'var(--ok)' : 'var(--accent)';
  const totalCount = snapshot.summary.totalCount;

  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Grid: <code>{track.rows}×{track.cols}</code>
      </span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{snapshot.phase}</code>
      </span>
      <span className="badge">
        Baseline: <code>{snapshot.field.baseline >= 0 ? `${snapshot.field.baseline} ps` : 'Unreachable'}</code>
      </span>
      <span className="badge">
        Rule: <code>K≤{snapshot.config.maxDuration}, ≥{snapshot.config.minSaving}ps</code>
      </span>
      <span className="badge">
        Jump: <code>{formatJump(snapshot)}</code>
      </span>
      <span
        className={isComplete && totalCount > 0 ? 'badge status-solved' : 'badge'}
        style={isComplete && totalCount > 0 ? { borderColor: 'var(--gold)' } : undefined}
      >
        Cheats:{' '}
        <strong className={isComplete && totalCount > 0 ? 'gold' : undefined}>
          <code>{snapshot.revealedCheatCount} / {totalCount}</code>
        </strong>
      </span>
    </div>
  );
}

/** Shared interactive Race Condition visualizer parameterized by `CheatConfig`. */
export function RaceConditionVisualizer({ rawInput, config }: RaceConditionVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, config), [rawInput, config]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${config.maxDuration}x${config.minSaving}`, 140);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <RaceHud snapshot={snapshot} />
      <RacetrackCanvas snapshot={snapshot} />
      <SavingHistogram snapshot={snapshot} />
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
        {LEGEND.map(([label, color]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: color, border: '1px solid var(--border)' }} />
            {label}
          </span>
        ))}
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
