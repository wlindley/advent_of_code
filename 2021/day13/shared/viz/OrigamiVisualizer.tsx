import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  frameSheet,
  tryDecodeDotSheet,
  type FoldInstruction,
  type OrigamiManual,
  type OrigamiSolver,
  type OrigamiTraceFrame,
} from '../index';
import { OrigamiSheetCanvas } from './OrigamiSheetCanvas';

export interface OrigamiVisualizerProps<TAnswer extends string | number> {
  readonly rawInput: string;
  readonly solver: OrigamiSolver<TAnswer>;
}

type VisualizerModel<TAnswer> =
  | { readonly ok: true; readonly manual: OrigamiManual; readonly answer: TAnswer; readonly frames: readonly OrigamiTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildModel<TAnswer>(rawInput: string, solver: OrigamiSolver<TAnswer>): VisualizerModel<TAnswer> {
  try {
    const manual = solver.parse(rawInput);
    const answer = solver.solve(manual);
    const frames = solver.trace(manual, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, manual, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

interface StatusProps<TAnswer extends string | number> {
  readonly policyName: string;
  readonly answerLabel: string;
  readonly answer: TAnswer;
  readonly targetFolds: number;
  readonly frame: OrigamiTraceFrame;
  readonly nextFold: FoldInstruction | null;
  readonly decodedPreview: string | null;
  readonly truncated: boolean;
}

function OrigamiStatusBar<TAnswer extends string | number>(props: StatusProps<TAnswer>) {
  const sheet = frameSheet(props.frame);
  return (
    <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">{props.policyName}</span>
        <span className="badge">Folds: <strong>{props.frame.foldsApplied} / {props.targetFolds}</strong></span>
        <span className="badge">Dots: <strong>{sheet.dotCount}</strong></span>
        <span className="badge">Size: <strong>{sheet.bounds.width}x{sheet.bounds.height}</strong></span>
        {props.frame.kind === 'folded' && (
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Merged: <strong>{props.frame.outcome.overlapCount}</strong>
          </span>
        )}
        {props.nextFold !== null && (
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Next: <strong>{props.nextFold.axis}={props.nextFold.value}</strong>
          </span>
        )}
        {props.decodedPreview !== null && (
          <span className="badge status-solved">OCR: <strong>{props.decodedPreview}</strong></span>
        )}
        {props.truncated && (
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Preview capped at {DEFAULT_TRACE_MAX_STEPS} frames
          </span>
        )}
      </div>
      <span className="badge status-solved">{props.answerLabel}: <strong>{String(props.answer)}</strong></span>
    </div>
  );
}

/** Shared interactive Transparent Origami visualizer parameterized by an `OrigamiSolver`. */
export function OrigamiVisualizer<TAnswer extends string | number>({ rawInput, solver }: OrigamiVisualizerProps<TAnswer>) {
  const model = useMemo(() => buildModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.name}:${rawInput}`, 450);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {model.ok ? 'No trace frames available' : model.message}</p>
      </div>
    );
  }

  const targetFolds = solver.policy.foldCount(model.manual);
  const nextFold = activeFrame.foldsApplied < targetFolds ? model.manual.folds[activeFrame.foldsApplied]! : null;
  const decodedPreview = tryDecodeDotSheet(frameSheet(activeFrame));
  const truncated = model.frames.length < targetFolds + 1;

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <OrigamiStatusBar
          policyName={solver.policy.name}
          answerLabel={solver.policy.answerLabel}
          answer={model.answer}
          targetFolds={targetFolds}
          frame={activeFrame}
          nextFold={nextFold}
          decodedPreview={decodedPreview}
          truncated={truncated}
        />
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
      <OrigamiSheetCanvas frame={activeFrame} nextFold={nextFold} />
    </div>
  );
}
