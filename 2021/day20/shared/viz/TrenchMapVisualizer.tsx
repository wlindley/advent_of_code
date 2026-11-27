import { useEffect, useMemo, useRef } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type TrenchMapSolver, type TrenchTraceFrame } from '../index';
import { CANVAS_HEIGHT, CANVAS_WIDTH, renderTrenchCanvas } from './canvasRenderer';

export interface TrenchMapVisualizerProps {
  readonly rawInput: string;
  readonly solver: TrenchMapSolver;
}

type TraceModel =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly TrenchTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceModel(rawInput: string, solver: TrenchMapSolver): TraceModel {
  try {
    const parsed = solver.parse(rawInput);
    const frames = solver.trace(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const last = frames[frames.length - 1];
    const answerText = last !== undefined && last.image.background === 0
      ? solver.formatAnswer(last.image.totalLitPixels)
      : '∞ (lit void)';
    return { ok: true, answerText, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function VoidParityBadge({ background }: { readonly background: 0 | 1 }) {
  const isLit = background === 1;
  return (
    <span
      className="badge"
      style={{
        borderColor: isLit ? 'var(--gold)' : 'var(--ok)',
        color: isLit ? 'var(--gold)' : 'var(--ok)',
      }}
    >
      Void: {isLit ? 'LIT (∞ pixels!)' : 'DARK (finite)'}
    </span>
  );
}

function TrenchTelemetry({
  frame,
  answerText,
}: {
  readonly frame: TrenchTraceFrame;
  readonly answerText: string;
}) {
  const { image } = frame;
  return (
    <div className="meta-row" aria-label="Enhancement frame telemetry">
      <span className="badge">
        Pass {frame.step} / {frame.totalSteps}
      </span>
      <span className="badge">
        Active Box {image.width} × {image.height}
      </span>
      <VoidParityBadge background={image.background} />
      <span className="badge">Finite Lit {image.finiteLitCount}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Answer {answerText}
      </span>
    </div>
  );
}

/** Interactive Trench Map cellular-automaton visualizer with explicit infinite-void parity. */
export function TrenchMapVisualizer({ rawInput, solver }: TrenchMapVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const model = useMemo(() => buildTraceModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.steps}:${rawInput}`, 350);
  const activeFrame = frames[playback.step] ?? null;
  const finalFrame = frames[frames.length - 1] ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || activeFrame === null || finalFrame === null) return;
    renderTrenchCanvas(canvas, activeFrame.image, finalFrame.image.width, finalFrame.image.height);
  }, [activeFrame, finalFrame]);

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize trench map: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <TrenchTelemetry frame={activeFrame} answerText={model.answerText} />
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
      <div className="card" style={{ marginBottom: 0, padding: '0.75rem' }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Trench map at pass ${activeFrame.step} of ${activeFrame.totalSteps}`}
          style={{
            width: '100%',
            maxWidth: `${CANVAS_WIDTH}px`,
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            height: 'auto',
            display: 'block',
            margin: '0 auto',
            borderRadius: '6px',
            border: '1px solid var(--border)',
          }}
        />
      </div>
    </div>
  );
}
