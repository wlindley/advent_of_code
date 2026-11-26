export interface VizColors {
  readonly bg: string;
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly ok: string;
  readonly warn: string;
  readonly err: string;
  readonly gold: string;
}

const FALLBACK_COLORS: VizColors = {
  bg: '#f6f8fa',
  surface: '#ffffff',
  border: '#d0d7de',
  text: '#1f2328',
  muted: '#59636e',
  accent: '#0969da',
  ok: '#1a7f37',
  warn: '#bc4c00',
  err: '#cf222e',
  gold: '#9a6700',
};

function readToken(styles: CSSStyleDeclaration, token: string, fallback: string): string {
  const value = styles.getPropertyValue(token).trim();
  return value.length > 0 ? value : fallback;
}

/** Resolves CSS light-mode design tokens from the canvas element with safe fallbacks. */
export function resolveVizColors(canvas: HTMLCanvasElement): VizColors {
  const styles = getComputedStyle(canvas);
  return {
    bg: readToken(styles, '--bg', FALLBACK_COLORS.bg),
    surface: readToken(styles, '--surface', FALLBACK_COLORS.surface),
    border: readToken(styles, '--border', FALLBACK_COLORS.border),
    text: readToken(styles, '--text', FALLBACK_COLORS.text),
    muted: readToken(styles, '--muted', FALLBACK_COLORS.muted),
    accent: readToken(styles, '--accent', FALLBACK_COLORS.accent),
    ok: readToken(styles, '--ok', FALLBACK_COLORS.ok),
    warn: readToken(styles, '--warn', FALLBACK_COLORS.warn),
    err: readToken(styles, '--err', FALLBACK_COLORS.err),
    gold: readToken(styles, '--gold', FALLBACK_COLORS.gold),
  };
}

/** Returns a distinct high-contrast stroke/marker color for slope `index`. */
export function slopeAccentColor(index: number, colors: VizColors): string {
  const palette = [colors.accent, colors.ok, colors.gold, colors.warn, colors.err];
  return palette[index % palette.length]!;
}
