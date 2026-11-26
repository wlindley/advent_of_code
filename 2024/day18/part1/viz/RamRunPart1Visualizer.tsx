import { useMemo } from 'react';
import { PlaybackControls, type VisualizerProps, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_RAM_RUN_CONFIG,
  type RamRunConfig,
  type RamRunSnapshot,
  buildCorruptionAndWaveTrace,
  parseMemorySpace,
} from '../../shared';
import { RamRunCanvas } from '../../shared/viz/RamRunCanvas';

export interface RamRunPart1VisualizerProps extends VisualizerProps {
  readonly config?: RamRunConfig;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly RamRunSnapshot[]; readonly targetFallen: number }
  | { readonly ok: false; readonly message: string };

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Corrupted byte', '#1e293b'],
  ['Latest byte', '#ea580c'],
  ['BFS wave', '#67e8f9'],
  ['Start S', '#059669'],
  ['End E', '#e11d48'],
  ['Shortest path', '#d97706'],
];

function buildPart1Trace(rawInput: string, config: RamRunConfig): TraceState {
  try {
    const memory = parseMemorySpace(rawInput, config.gridSize);
    const targetFallen = Math.min(config.fallenCount, memory.byteCount);
    const frames = buildCorruptionAndWaveTrace(memory, config.fallenCount);
    return { ok: true, frames, targetFallen };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function Part1Hud({
  snapshot,
  targetFallen,
}: {
  readonly snapshot: RamRunSnapshot;
  readonly targetFallen: number;
}) {
  const isComplete = snapshot.phase === 'complete';
  const phaseColor = isComplete ? 'var(--ok)' : 'var(--accent)';
  const pathText = isComplete ? (snapshot.shortestDistance ?? 'Blocked') : '…';

  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Grid: <code>{snapshot.memory.gridSize}×{snapshot.memory.gridSize}</code>
      </span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{snapshot.phase}</code>
      </span>
      <span className="badge">
        Fallen: <code>{snapshot.fallenCount} / {targetFallen}</code>
      </span>
      <span className="badge">
        Wave: <code>{snapshot.maxWaveDistance >= 0 ? snapshot.maxWaveDistance : '—'}</code>
      </span>
      <span className="badge">
        Visited: <code>{snapshot.revealedVisitedCount}</code>
      </span>
      <span
        className={isComplete && snapshot.reachable ? 'badge status-solved' : 'badge'}
        style={isComplete && snapshot.reachable ? { borderColor: 'var(--gold)' } : undefined}
      >
        Shortest Path:{' '}
        <strong className={isComplete && snapshot.reachable ? 'gold' : undefined}>
          <code>{pathText}</code>
        </strong>
      </span>
    </div>
  );
}

/** Interactive corruption + BFS wave + shortest-path visualizer for RAM Run Part 1. */
export function RamRunPart1Visualizer({
  rawInput,
  config = DEFAULT_RAM_RUN_CONFIG,
}: RamRunPart1VisualizerProps) {
  const state = useMemo(() => buildPart1Trace(rawInput, config), [rawInput, config]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${config.gridSize}x${config.fallenCount}`, 90);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <Part1Hud snapshot={snapshot} targetFallen={state.targetFallen} />
      <RamRunCanvas snapshot={snapshot} />
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
