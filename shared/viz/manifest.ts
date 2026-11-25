import type { ComponentType } from 'react';
import type { PuzzleMeta, PuzzleSolver } from '../core';

export interface VisualizerProps {
  readonly rawInput: string;
}

export interface PuzzlePartManifest {
  readonly meta: PuzzleMeta;
  readonly exampleInput: string;
  readonly exampleAnswer: string;
  readonly solver: PuzzleSolver<unknown, unknown>;
  readonly Visualizer: ComponentType<VisualizerProps>;
}
