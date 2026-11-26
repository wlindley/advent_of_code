/** Maps a frequency character in `[0-9A-Za-z]` to a deterministic high-contrast light-mode color. */
export function frequencyColor(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 48 && code <= 57) {
    const hue = 210 + (code - 48) * 6;
    return `hsl(${hue}, 78%, 38%)`;
  }
  if (code >= 65 && code <= 90) {
    const hue = Math.round((code - 65) * 7.5);
    return `hsl(${hue}, 78%, 36%)`;
  }
  if (code >= 97 && code <= 122) {
    const hue = 270 + Math.round((code - 97) * 3.2);
    return `hsl(${hue}, 72%, 30%)`;
  }
  return 'var(--muted)';
}
