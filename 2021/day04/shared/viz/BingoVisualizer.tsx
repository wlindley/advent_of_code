import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  solveBingoGame,
  type BingoGame,
  type BingoTraceFrame,
  type BoardWin,
  type WinnerSelectionPolicy,
} from '../index';
import { BingoBoardCard } from './BingoBoardCard';
import { BoardStatusStrip } from './BoardStatusStrip';
import { DrawStreamBar } from './DrawStreamBar';

export interface BingoVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<BingoGame, bigint, BingoTraceFrame>;
  readonly policy: WinnerSelectionPolicy;
}

interface BingoOk {
  readonly ok: true;
  readonly game: BingoGame;
  readonly answer: bigint;
  readonly targetWin: BoardWin;
  readonly frames: readonly BingoTraceFrame[];
}

type BingoViewModel = BingoOk | { readonly ok: false; readonly message: string };

function buildBingoViewModel(
  rawInput: string,
  solver: PuzzleSolver<BingoGame, bigint, BingoTraceFrame>,
  policy: WinnerSelectionPolicy,
): BingoViewModel {
  try {
    const game = solver.parse(rawInput);
    const answer = solver.solve(game);
    const targetWin = solveBingoGame(game, policy);
    const frames = solver.trace ? solver.trace(game, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    return { ok: true, game, answer, targetWin, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({ vm, frame, policy }: { readonly vm: BingoOk; readonly frame: BingoTraceFrame; readonly policy: WinnerSelectionPolicy }) {
  const targetSnap = frame.targetSnapshot;
  return (
    <div className="meta-row">
      <span className="badge">
        Game: <code>{vm.game.boardCount} boards · {vm.game.drawCount} draws</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Policy: <strong>{policy.label}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Won: <code>{frame.wonCount}/{vm.game.boardCount}</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Target #{vm.targetWin.boardId + 1}:{' '}
        {frame.isTargetWon ? (
          <strong>{String(targetSnap.unmarkedSum)} × {vm.targetWin.winningDraw} = {String(vm.targetWin.score)}</strong>
        ) : (
          <span>unmarked {String(targetSnap.unmarkedSum)}</span>
        )}
      </span>
      <span className="badge status-solved">
        Final Score: <strong>{String(vm.answer)}</strong>
      </span>
      {vm.targetWin.winDrawIndex + 1 > vm.frames.length && (
        <span className="muted">Sampled {vm.frames.length} of {vm.targetWin.winDrawIndex + 1} draws</span>
      )}
    </div>
  );
}

/** Interactive Giant Squid Bingo board playback visualizer. */
export function BingoVisualizer({ rawInput, solver, policy }: BingoVisualizerProps) {
  const viewModel = useMemo(() => buildBingoViewModel(rawInput, solver, policy), [rawInput, solver, policy]);
  const frames = viewModel.ok ? viewModel.frames : [];
  const playback = usePlayback(frames.length, rawInput, 380);

  const activeFrame = frames[playback.step] ?? null;

  if (!viewModel.ok || !activeFrame) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {viewModel.ok ? 'No trace frames available' : viewModel.message}</p>
      </div>
    );
  }
  const visibleIds = activeFrame.visibleBoards.map((snap) => snap.boardId);

  return (
    <div className="stack">
      <TelemetryBadges vm={viewModel} frame={activeFrame} policy={policy} />
      <DrawStreamBar drawWindow={activeFrame.drawWindow} totalDraws={viewModel.game.drawCount} drawnValue={activeFrame.drawnValue} />
      <BoardStatusStrip statuses={activeFrame.boardStatuses} visibleBoardIds={visibleIds} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {activeFrame.visibleBoards.map((snap) => (
          <BingoBoardCard key={snap.boardId} snapshot={snap} activeDrawValue={activeFrame.drawnValue} />
        ))}
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
