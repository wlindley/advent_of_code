import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  analyzeVentField,
  type VentField,
  type VentOverlapSummary,
  type VentSelectionPolicy,
  type VentTraceFrame,
} from '../index';
import { VentCanvas } from './VentCanvas';
import { VentLegend } from './VentLegend';

export interface VentFieldVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<VentField, number, VentTraceFrame>;
  readonly policy: VentSelectionPolicy;
}

interface VentOk {
  readonly ok: true;
  readonly field: VentField;
  readonly answer: number;
  readonly summary: VentOverlapSummary;
  readonly frames: readonly VentTraceFrame[];
}

type VentViewModel = VentOk | { readonly ok: false; readonly message: string };

function buildVentViewModel(
  rawInput: string,
  solver: PuzzleSolver<VentField, number, VentTraceFrame>,
  policy: VentSelectionPolicy,
): VentViewModel {
  try {
    const field = solver.parse(rawInput);
    const answer = solver.solve(field);
    const summary = analyzeVentField(field, policy);
    const frames = solver.trace ? solver.trace(field, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    return { ok: true, field, answer, summary, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive Canvas 2D playback visualizer for hydrothermal vent overlap analysis. */
export function VentFieldVisualizer({ rawInput, solver, policy }: VentFieldVisualizerProps) {
  const viewModel = useMemo(() => buildVentViewModel(rawInput, solver, policy), [rawInput, solver, policy]);
  const frames = viewModel.ok ? viewModel.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);

  const activeFrame = frames[playback.step] ?? null;

  if (!viewModel.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize input: {viewModel.ok ? 'No trace frames available' : viewModel.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <VentLegend
        policy={policy}
        field={viewModel.field}
        summary={viewModel.summary}
        frame={activeFrame}
        frameCount={frames.length}
        answer={viewModel.answer}
      />
      <VentCanvas
        field={viewModel.field}
        policy={policy}
        frames={frames}
        activeIndex={playback.step}
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
  );
}
