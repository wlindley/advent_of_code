import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { PacketComparePanel } from '../../shared/viz/PacketComparePanel';
import { DEFAULT_MAX_TRACE_STEPS, DIVIDER_FIRST, DIVIDER_SECOND, solver, type DividerTraceFrame } from '../domain';
import { DividerBandChart } from './DividerBandChart';

type VizState =
  | { readonly ok: true; readonly frames: readonly DividerTraceFrame[] }
  | { readonly ok: false; readonly message: string };

type DividerChoice = 'first' | 'second';

function buildVizState(rawInput: string): VizState {
  try {
    const parsed = solver.parse(rawInput);
    const frames = solver.trace?.(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function KpiBadges({ frame, frameCount }: { readonly frame: DividerTraceFrame; readonly frameCount: number }) {
  return (
    <div className="meta-row" style={{ marginBottom: '0.65rem' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Packet: <code>#{frame.packetIndex} / {frame.totalPackets}</code>
      </span>
      <span className="badge">Pos <code>[[2]]</code>: <strong>#{frame.firstDividerIndex}</strong></span>
      <span className="badge">Pos <code>[[6]]</code>: <strong>#{frame.secondDividerIndex}</strong></span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Decoder Key: <strong>{frame.decoderKey}</strong>
      </span>
      {frameCount < frame.totalPackets && <span className="muted">Sampled {frameCount} of {frame.totalPackets} packets</span>}
    </div>
  );
}

function DividerToggleBar({ frame, choice, onSelect }: {
  readonly frame: DividerTraceFrame;
  readonly choice: DividerChoice;
  readonly onSelect: (next: DividerChoice) => void;
}) {
  if (frame.secondComparison === null) {
    return (
      <div className="meta-row" style={{ marginBottom: '0.55rem' }}>
        <span className="badge status-solved">
          Short-circuited: packet &lt; <code>[[2]]</code> (no comparison vs <code>[[6]]</code> needed)
        </span>
      </div>
    );
  }
  return (
    <div className="meta-row" style={{ marginBottom: '0.55rem' }} role="group" aria-label="Divider comparison selector">
      <button type="button" className={choice === 'first' ? 'primary' : ''} onClick={() => onSelect('first')}>vs [[2]]</button>
      <button type="button" className={choice === 'second' ? 'primary' : ''} onClick={() => onSelect('second')}>vs [[6]]</button>
    </div>
  );
}

function VisualizerBody({ frames, frame, playback, choice, onSelectChoice }: {
  readonly frames: readonly DividerTraceFrame[];
  readonly frame: DividerTraceFrame;
  readonly playback: PlaybackState;
  readonly choice: DividerChoice;
  readonly onSelectChoice: (next: DividerChoice) => void;
}) {
  const activeChoice: DividerChoice = frame.secondComparison === null ? 'first' : choice;
  const divider = activeChoice === 'first' ? DIVIDER_FIRST : DIVIDER_SECOND;
  const comparison = activeChoice === 'first' ? frame.firstComparison : frame.secondComparison!;
  return (
    <div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
      <KpiBadges frame={frame} frameCount={frames.length} />
      <DividerBandChart frames={frames} activeFrame={frame} activeStep={playback.step} onSelectStep={(next) => handleStepChange(playback, next)} />
      <DividerToggleBar frame={frame} choice={activeChoice} onSelect={onSelectChoice} />
      <PacketComparePanel left={frame.packet} right={divider} comparison={comparison} leftLabel={`Packet #${frame.packetIndex}`} rightLabel={activeChoice === 'first' ? 'Divider [[2]]' : 'Divider [[6]]'} />
    </div>
  );
}

/** Interactive visualizer stepping through Part 2 divider-band packet classification. */
export function DistressSignalPart2Visualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frameCount = state.ok ? state.frames.length : 0;
  const playback = usePlayback(frameCount, rawInput, 260);
  const [choice, setChoice] = useState<DividerChoice>('second');
  const frame = state.ok ? state.frames[playback.step] : undefined;

  useEffect(() => {
    setChoice(frame?.secondComparison === null ? 'first' : 'second');
  }, [playback.step, frame?.secondComparison]);

  if (!state.ok) return <p className="error-text">Cannot visualize input: {state.message}</p>;
  if (!frame) return <p className="muted">No trace frames available.</p>;

  return <VisualizerBody frames={state.frames} frame={frame} playback={playback} choice={choice} onSelectChoice={setChoice} />;
}
