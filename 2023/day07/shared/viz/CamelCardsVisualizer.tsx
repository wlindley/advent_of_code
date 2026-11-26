import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls } from '../../../../shared/viz/PlaybackControls';
import { usePlayback, type PlaybackState } from '../../../../shared/viz/usePlayback';
import type { CamelCardsDeal } from '../ranking';
import { DEFAULT_MAX_TRACE_STEPS, type CamelCardsTraceFrame } from '../trace';
import { CardSpotlight } from './CardSpotlight';
import { TierDistributionChart } from './TierDistributionChart';
import { WinningsSparkline } from './WinningsSparkline';

export interface CamelCardsVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<CamelCardsDeal, bigint, CamelCardsTraceFrame>;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly CamelCardsTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(
  rawInput: string,
  solver: PuzzleSolver<CamelCardsDeal, bigint, CamelCardsTraceFrame>,
): TraceResult {
  try {
    const deal = solver.parse(rawInput);
    const frames = solver.trace!(deal, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

export function CamelCardsVisualizer({ rawInput, solver }: CamelCardsVisualizerProps) {
  const trace = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = trace.ok ? trace.frames : [];
  const playback = usePlayback(frames.length, rawInput, 360);
  const activeFrame = frames[playback.step];

  if (!trace.ok) {
    return <p className="error-text">Unable to visualize input: {trace.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No Camel Cards hands to visualize.</p>;
  }

  const finalFrame = frames[frames.length - 1]!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">Rule: <strong>{activeFrame.ranked.rule.label}</strong></span>
        <span className="badge">Hands: <strong>{activeFrame.totalHands}</strong></span>
        <span className="badge">Total Winnings: <strong className="gold">{finalFrame.runningWinnings.toString()}</strong></span>
        {activeFrame.totalHands > frames.length && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Sampled {frames.length} of {activeFrame.totalHands} ranked hands
          </span>
        )}
      </div>
      <CardSpotlight frame={activeFrame} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '0.65rem' }}>
        <TierDistributionChart
          frame={activeFrame}
          finalCounts={finalFrame.cumulativeTierCounts}
          frames={frames}
          onSelectFrame={(idx) => selectStep(playback, idx)}
        />
        <WinningsSparkline
          frames={frames}
          activeIndex={playback.step}
          onSelectFrame={(idx) => selectStep(playback, idx)}
        />
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
