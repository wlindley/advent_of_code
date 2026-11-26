export type MoveDir = '^' | 'v' | '<' | '>';

export const MOVE_DELTAS: Readonly<Record<MoveDir, readonly [number, number]>> = Object.freeze({
  '^': Object.freeze([-1, 0] as const),
  'v': Object.freeze([1, 0] as const),
  '<': Object.freeze([0, -1] as const),
  '>': Object.freeze([0, 1] as const),
});

export interface WarehouseSpec {
  readonly rows: readonly string[];
  readonly moves: readonly MoveDir[];
}

const RAW_MAP_CHARS = new Set(['#', '.', 'O', '@']);

function parseMapRows(section: string): readonly string[] {
  const rows = section.split('\n');
  const width = rows[0]!.length;
  let robotCount = 0;

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r]!;
    if (row.length !== width) {
      throw new Error(`Warehouse map must be rectangular: row ${r} has width ${row.length}, expected ${width}`);
    }
    for (const ch of row) {
      if (!RAW_MAP_CHARS.has(ch)) {
        throw new Error(`Invalid map character '${ch}' at row ${r}`);
      }
      if (ch === '@') robotCount += 1;
    }
  }

  if (robotCount !== 1) {
    throw new Error(`Warehouse map must contain exactly one robot '@', found ${robotCount}`);
  }
  return Object.freeze(rows);
}

function parseMoves(section: string): readonly MoveDir[] {
  const moves: MoveDir[] = [];
  for (const ch of section) {
    if (ch === '\n') continue;
    if (!Object.hasOwn(MOVE_DELTAS, ch)) {
      throw new Error(`Invalid move character '${ch}'`);
    }
    moves.push(ch as MoveDir);
  }
  return Object.freeze(moves);
}

/** Parses raw puzzle text into a validated, deep-frozen warehouse specification. */
export function parseWarehouseSpec(raw: string): WarehouseSpec {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const sections = normalized.split(/\n(?:[ \t]*\n)+/);
  if (sections.length !== 2) {
    throw new Error(`Expected two sections (warehouse map and move list), got ${sections.length}`);
  }
  const [mapSection, movesSection] = sections as [string, string];
  const rows = parseMapRows(mapSection);
  const moves = parseMoves(movesSection);
  return Object.freeze({ rows, moves });
}
