import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  CompactionTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  DiskBlockReplay,
  DiskMap,
  parseDiskMap,
  sampleCompactionTrace,
  type CompactionStrategy,
} from '../index';
import { DiskPlatterCanvas } from './DiskPlatterCanvas';
import { DiskStripSvg } from './DiskStripSvg';

export interface DiskCompactionVisualizerProps {
  readonly rawInput: string;
  readonly strategy: CompactionStrategy;
}

type VizState =
  | {
      readonly ok: true;
      readonly disk: DiskMap;
      readonly frames: readonly CompactionTraceFrame[];
      readonly replay: DiskBlockReplay;
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, strategy: CompactionStrategy): VizState {
  try {
    const disk = parseDiskMap(rawInput);
    const moves = strategy.plan(disk);
    const frames = sampleCompactionTrace(disk, moves, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const replay = new DiskBlockReplay(disk, moves);
    return { ok: true, disk, frames, replay };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function KpiHeader({
  disk,
  frame,
  strategy,
}: {
  readonly disk: DiskMap;
  readonly frame: CompactionTraceFrame;
  readonly strategy: CompactionStrategy;
}) {
  const isComplete = frame.appliedMoves === frame.totalMoves;
  return (
    <div className="meta-row">
      <span className="badge">Files: <code>{disk.fileCount}</code></span>
      <span className="badge">
        Blocks: <code>{disk.totalFileBlocks}</code> used / <code>{disk.totalBlocks}</code>
      </span>
      <span className="badge">Strategy: <code>{strategy.id}</code></span>
      <span className={`badge ${isComplete ? 'status-solved' : ''}`}>
        Checksum: <strong className="gold"><code>{frame.checksum.toString()}</code></strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Moves: <code>{frame.appliedMoves} / {frame.totalMoves}</code> ({frame.blocksMoved} blk)
      </span>
      {frame.lastMove && (
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Last: <code>#{frame.lastMove.fileId} ×{frame.lastMove.length}</code> ({frame.lastMove.fromStart}→{frame.lastMove.toStart})
        </span>
      )}
    </div>
  );
}

function VizFooter({
  isSmallDisk,
  totalSteps,
  playback,
}: {
  readonly isSmallDisk: boolean;
  readonly totalSteps: number;
  readonly playback: PlaybackState;
}) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span>View: <strong>{isSmallDisk ? 'Sector Strip (≤100 blocks)' : 'HiDPI Platter (>100 blocks)'}</strong></span>
        <span>·</span>
        <span><strong style={{ color: 'var(--ok)' }}>Green outline</strong>: destination extent</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Amber outline</strong>: vacated source</span>
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
    </>
  );
}

/** Dual-scale interactive disk compaction visualizer bounded to `DEFAULT_MAX_TRACE_STEPS` frames. */
export function DiskCompactionVisualizer({ rawInput, strategy }: DiskCompactionVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, strategy), [rawInput, strategy]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${strategy.id}`, 220);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }

  const frame = state.frames[playback.step] ?? state.frames[0]!;
  state.replay.seek(frame.appliedMoves);
  const isSmallDisk = state.disk.totalBlocks <= 100;

  return (
    <div>
      <KpiHeader disk={state.disk} frame={frame} strategy={strategy} />
      <div style={{ margin: '0.6rem 0' }}>
        {isSmallDisk ? (
          <DiskStripSvg blocks={state.replay.blocks} lastMove={frame.lastMove} />
        ) : (
          <DiskPlatterCanvas
            blocks={state.replay.blocks}
            appliedMoves={frame.appliedMoves}
            lastMove={frame.lastMove}
          />
        )}
      </div>
      <VizFooter isSmallDisk={isSmallDisk} totalSteps={totalSteps} playback={playback} />
    </div>
  );
}
