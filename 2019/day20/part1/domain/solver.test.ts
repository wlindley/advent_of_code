import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
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

const EXAMPLE_2 = `                   A               
                   A               
  #################.#############  
  #.#...#...................#.#.#  
  #.#.#.###.###.###.#########.#.#  
  #.#.#.......#...#.....#.#.#...#  
  #.#########.###.#####.#.#.###.#  
  #.............#.#.....#.......#  
  ###.###########.###.#####.#.#.#  
  #.....#        A   C    #.#.#.#  
  #######        S   P    #####.#  
  #.#...#                 #......VT
  #.#.#.#                 #.#####  
  #...#.#               YN....#.#  
  #.###.#                 #####.#  
DI....#.#                 #.....#  
  #####.#                 #.###.#  
ZZ......#               QG....#..AS
  ###.###                 #######  
JO..#.#.#                 #.....#  
  #.#.#.#                 ###.#.#  
  #...#..DI             BU....#..LF
  #####.#                 #.#####  
YN......#               VT..#....QG
  #.###.#                 #.###.#  
  #.#...#                 #.....#  
  ###.###    J L     J    #.#.###  
  #.....#    O F     P    #.#...#  
  #.###.#####.#.#####.#####.###.#  
  #...#.#.#...#.....#.....#.#...#  
  #.#####.###.###.#.#.#########.#  
  #...#.#.....#...#.#.#.#.....#.#  
  #.###.#####.###.###.#.#.#######  
  #.#.........#...#.............#  
  #########.###.###.#############  
           B   J   C               
           U   P   P               `;
describe('2019 Day 20 Part 1 solver', () => {
  it('solves official Examples 1 (23) and 2 (58)', () => {
    expect(executeSolver(solver, EXAMPLE_1).answer).toBe(23);
    expect(executeSolver(solver, EXAMPLE_2).answer).toBe(58);
  });
  it('produces bounded trace frames ending at ZZ and rejects invalid inputs', () => {
    const frames = solver.trace(solver.parse(EXAMPLE_2), { maxSteps: 30 });
    expect(frames.length).toBe(30);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[frames.length - 1]!.stepIndex).toBe(58);
    expect(() => solver.parse('')).toThrow(/empty/);
    expect(() => solver.solve(solver.parse('  A   Z  \n  A   Z  \n #.# #.# \n ### ### '))).toThrow(/No path/);
  });
});
