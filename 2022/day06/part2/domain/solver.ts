import { createMarkerSolver, type MarkerSolver } from '../../shared';

export const MESSAGE_MARKER_LENGTH = 14;

/** Start-of-message marker solver (`K = 14`). */
export const solver: MarkerSolver = createMarkerSolver(MESSAGE_MARKER_LENGTH);
