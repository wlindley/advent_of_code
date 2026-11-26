import { PipeMazeHiDpiCanvas } from './PipeMazeHiDpiCanvas';
import { PipeMazeSvg, type PipeMazeViewProps } from './PipeMazeSvg';

const SVG_MAX_SIDE = 25;

export type { ClutterMode, PipeMazeViewProps } from './PipeMazeSvg';

/** Dual-mode maze renderer: crisp SVG for <= 25x25, HiDPI canvas for larger grids. */
export function PipeMazeCanvas(props: PipeMazeViewProps) {
  const useSvg = props.maze.rows <= SVG_MAX_SIDE && props.maze.cols <= SVG_MAX_SIDE;
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        background: 'var(--surface)',
        padding: '0.5rem',
        overflowX: 'auto',
      }}
    >
      {useSvg ? <PipeMazeSvg {...props} /> : <PipeMazeHiDpiCanvas {...props} />}
    </div>
  );
}
