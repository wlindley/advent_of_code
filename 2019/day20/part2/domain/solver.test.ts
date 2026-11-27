import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { computeDepthStats } from '../../shared';
import { solver } from './index';

const EXAMPLE_1 = `         A           
         A           
  #######.#########  
  #######.........#  
  #######.#######.#  
  #######.#######.#  
  #######.#######.#  
  #####  B    ###.#  
BC...##  C    ###.#  
  ##.##       ###.#  
  ##...DE  F  ###.#  
  #####    G  ###.#  
  #########.#####.#  
DE..#######...###.#  
  #.#########.###.#  
FG..#########.....#  
  ###########.#####  
             Z       
             Z       `;

const EXAMPLE_3 = [
  '             Z L X W       C                 ',
  '             Z P Q B       K                 ',
  '  ###########.#.#.#.#######.###############  ',
  '  #...#.......#.#.......#.#.......#.#.#...#  ',
  '  ###.#.#.#.#.#.#.#.###.#.#.#######.#.#.###  ',
  '  #.#...#.#.#...#.#.#...#...#...#.#.......#  ',
  '  #.###.#######.###.###.#.###.###.#.#######  ',
  '  #...#.......#.#...#...#.............#...#  ',
  '  #.#########.#######.#.#######.#######.###  ',
  '  #...#.#    F       R I       Z    #.#.#.#  ',
  '  #.###.#    D       E C       H    #.#.#.#  ',
  '  #.#...#                           #...#.#  ',
  '  #.###.#                           #.###.#  ',
  '  #.#....OA                       WB..#.#..ZH',
  '  #.###.#                           #.#.#.#  ',
  'CJ......#                           #.....#  ',
  '  #######                           #######  ',
  '  #.#....CK                         #......IC',
  '  #.###.#                           #.###.#  ',
  '  #.....#                           #...#.#  ',
  '  ###.###                           #.#.#.#  ',
  'XF....#.#                         RF..#.#.#  ',
  '  #####.#                           #######  ',
  '  #......CJ                       NM..#...#  ',
  '  ###.#.#                           #.###.#  ',
  'RE....#.#                           #......RF',
  '  ###.###        X   X       L      #.#.#.#  ',
  '  #.....#        F   Q       P      #.#.#.#  ',
  '  ###.###########.###.#######.#########.###  ',
  '  #.....#...#.....#.......#...#.....#.#...#  ',
  '  #####.#.###.#######.#######.###.###.#.#.#  ',
  '  #.......#.......#.#.#.#.#...#...#...#.#.#  ',
  '  #####.###.#####.#.#.#.#.###.###.#.###.###  ',
  '  #.......#.....#.#...#...............#...#  ',
  '  #############.#.#.###.###################  ',
  '               A O F   N                     ',
  '               A A D   M                     ',
].join('\n');

const UNREACHABLE_AT_DEPTH_ZERO = [
  '    A     ',
  '    A     ',
  '  ##.#### ',
  '  #.....# ',
  '  #  B  # ',
  '  #  C  # ',
  '  ####### ',
  '  ##.#### ',
  'BC...#    ',
  '  ##.#### ',
  '    Z     ',
  '    Z     ',
].join('\n');

describe('2019 Day 20 Part 2 solver', () => {
  it('solves the official 37-line recursive example (396)', () => {
    expect(executeSolver(solver, EXAMPLE_3).answer).toBe(396);
  });

  it('walks directly from AA to ZZ at depth 0 on Example 1 (26 steps, 0 warps)', () => {
    expect(executeSolver(solver, EXAMPLE_1).answer).toBe(26);
    const frames = solver.trace(solver.parse(EXAMPLE_1));
    const last = frames[frames.length - 1]!;
    expect(computeDepthStats(last.path, last.stepIndex)).toEqual({
      currentDepth: 0,
      maxDepth: 0,
      warpCount: 0,
      totalSteps: 26,
      currentStep: 26,
    });
  });

  it('produces bounded trace frames and accurate computeDepthStats for Example 3', () => {
    const frames = solver.trace(solver.parse(EXAMPLE_3), { maxSteps: 40 });
    expect(frames).toHaveLength(40);
    expect(frames[0]!.stepIndex).toBe(0);
    const last = frames[39]!;
    expect(last.stepIndex).toBe(396);
    expect(last.path[0]!.depth).toBe(0);
    expect(last.path[396]!.depth).toBe(0);
    expect(computeDepthStats(last.path, last.stepIndex)).toEqual({
      currentDepth: 0,
      maxDepth: 10,
      warpCount: 32,
      totalSteps: 396,
      currentStep: 396,
    });
  });

  it('throws when ZZ is only reachable at nonzero depth', () => {
    expect(() => solver.solve(solver.parse(UNREACHABLE_AT_DEPTH_ZERO))).toThrow(/No path found from AA to ZZ/);
  });

  it('rejects empty input, missing ZZ, and invalid maxSteps separately', () => {
    expect(() => solver.parse('')).toThrow(/empty/);
    expect(() => solver.parse('  A  \n  A  \n #.# \n ### ')).toThrow(/ZZ/);
    expect(() => solver.trace(solver.parse(EXAMPLE_1), { maxSteps: 0 })).toThrow(RangeError);
  });
});
