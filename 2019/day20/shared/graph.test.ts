import { describe, expect, it } from 'vitest';
import { buildPortalGraph, reconstructCorridorPath } from './graph';
import { parseDonutMaze } from './maze';

const PASSTHROUGH_MAZE = [
  '     A     ',
  '     A     ',
  '  ###.###  ',
  '  #.....#  ',
  'BC..#.#..DE',
  '  #.#B#.#  ',
  '  #.#C#.#  ',
  '  #.#D#.#  ',
  '  #.#E#.#  ',
  '  #.....#  ',
  '  ###.###  ',
  '     Z     ',
  '     Z     ',
].join('\n');

const COLOCATED_MAZE = ['  ###  ', 'AA.ZZ  ', '  ###  '].join('\n');

const DISCONNECTED_MAZE = [
  '  A   Z  ',
  '  A   Z  ',
  ' #.# #.# ',
  ' ### ### ',
].join('\n');

describe('PortalGraph & corridor reconstruction', () => {
  it('walks through intermediate portal tiles and skips self-edges', () => {
    const maze = parseDonutMaze(PASSTHROUGH_MAZE);
    const graph = buildPortalGraph(maze);
    const startEdges = graph.adj[maze.startId]!;
    const labels = new Map(startEdges.map((e) => {
      const p = maze.portals[e.to]!;
      return [`${p.label}:${p.side}`, e.steps];
    }));

    expect(startEdges.some((e) => e.to === maze.startId)).toBe(false);
    expect(labels.get('BC:outer')).toBe(5);
    expect(labels.get('DE:outer')).toBe(5);
    expect(labels.get('ZZ:outer')).toBe(12);
    expect(Object.isFrozen(graph)).toBe(true);
  });

  it('supports 0-step co-located portals on the same open tile', () => {
    const maze = parseDonutMaze(COLOCATED_MAZE);
    const graph = buildPortalGraph(maze);
    expect(graph.adj[maze.startId]).toEqual([{ to: maze.goalId, steps: 0 }]);
    expect(graph.adj[maze.goalId]).toEqual([{ to: maze.startId, steps: 0 }]);
  });

  it('reconstructs shortest corridor paths including 0-step identical endpoints', () => {
    const maze = parseDonutMaze(PASSTHROUGH_MAZE);
    const aa = maze.portals[maze.startId]!;
    const zz = maze.portals[maze.goalId]!;

    expect(reconstructCorridorPath(maze, aa, aa)).toEqual([{ row: aa.row, col: aa.col }]);
    const path = reconstructCorridorPath(maze, aa, zz);
    expect(path[0]).toEqual({ row: aa.row, col: aa.col });
    expect(path[path.length - 1]).toEqual({ row: zz.row, col: zz.col });
    expect(path.length - 1).toBe(12);
  });

  it('throws when corridor endpoints are invalid or disconnected', () => {
    const maze = parseDonutMaze(DISCONNECTED_MAZE);
    const aa = maze.portals[maze.startId]!;
    const zz = maze.portals[maze.goalId]!;
    expect(buildPortalGraph(maze).adj[maze.startId]).toEqual([]);
    expect(() => reconstructCorridorPath(maze, aa, zz)).toThrow(/No corridor path/);
    expect(() => reconstructCorridorPath(maze, { row: 0, col: 0 }, zz)).toThrow(/open tiles/);
    expect(() => reconstructCorridorPath(maze, aa, { row: 0, col: 0 })).toThrow(/open tiles/);
  });
});
