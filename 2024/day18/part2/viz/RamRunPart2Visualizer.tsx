import { useMemo } from 'react';
import { PlaybackControls, type VisualizerProps, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_RAM_RUN_CONFIG,
  type RamRunSnapshot,
  parseMemorySpace,
} from '../../shared';
import { RamRunCanvas } from '../../shared/viz/RamRunCanvas';
import { buildBlockingByteTrace } from '../domain';

export interface RamRunPart2VisualizerProps extends VisualizerProps {
  readonly gridSize?: number;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly RamRunSnapshot[]; readonly targetFallen: number }
  | { readonly ok: false; readonly message: string };

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Corrupted byte', '#1e293b'],
  ['Latest byte', '#ea580c'],
  ['Blocking byte', '#dc2626'],
  ['BFS wave', '#67e8f9'],
  ['Start S', '#059669'],
  ['End E', '#e11d48'],
  ['Shortest path', '#d97706'],
];

function buildPart2Trace(rawInput: string, gridSize: number): TraceState {
  try {
    const memory = parseMemorySpace(rawInput, gridSize);
    const frames = buildBlockingByteTrace(memory);
    const targetFallen = frames[frames.length - 1]!.fallenCount;
    return { ok: true, frames, targetFallen };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function Part2Hud({
  snapshot,
  targetFallen,
}: {
  readonly snapshot: RamRunSnapshot;
  readonly targetFallen: number;
}) {
  const isComplete = snapshot.phase === 'complete';
  const phaseColor = isComplete ? 'var(--ok)' : 'var(--accent)';
  const pathText = snapshot.shortestDistance ?? 'Blocked';
  const blocking = snapshot.blockingByte;
  const blockingText = isComplete ? (blocking ? `${blocking.x},${blocking.y}` : 'None') : '…';

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
        Path: <code>{pathText}</code>
      </span>
      <span
        className={isComplete && blocking ? 'badge status-solved' : 'badge'}
        style={isComplete && blocking ? { borderColor: 'var(--gold)' } : undefined}
      >
        Blocking Byte:{' '}
        <strong className={isComplete && blocking ? 'gold' : undefined}>
          <code>{blockingText}</code>
        </strong>
      </span>
    </div>
  );
}

/** Interactive corruption and cutoff visualizer for RAM Run Part 2. */
export function RamRunPart2Visualizer({
  rawInput,
  gridSize = DEFAULT_RAM_RUN_CONFIG.gridSize,
}: RamRunPart2VisualizerProps) {
  const state = useMemo(() => buildPart2Trace(rawInput, gridSize), [rawInput, gridSize]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${gridSize}`, 90);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <Part2Hud snapshot={snapshot} targetFallen={state.targetFallen} />
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
