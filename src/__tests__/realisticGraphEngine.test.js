import { describe, it, expect } from 'vitest';
import { nodesForLines, expandToRealisticGraph } from '../engine/realisticGraphEngine';

describe('Realistic Graph Engine & 3-Port Manifolds', () => {
  it('calculates correct number of 3-port nodes using ceil((N-1)/2)', () => {
    expect(nodesForLines(1)).toBe(0);
    expect(nodesForLines(2)).toBe(1);
    expect(nodesForLines(3)).toBe(1);
    expect(nodesForLines(4)).toBe(2);
    expect(nodesForLines(5)).toBe(2);
    expect(nodesForLines(6)).toBe(3);
    expect(nodesForLines(7)).toBe(3);
    expect(nodesForLines(8)).toBe(4);
    expect(nodesForLines(9)).toBe(4);
    expect(nodesForLines(12)).toBe(6);
  });

  it('generates exactly 3 mergers and 3 splitters for 6 machines producing Wet Concrete', () => {
    // 6 refineries producing wet concrete:
    // Inputs: limestone (120/machine * 6 = 720), water (100/machine * 6 = 600)
    // Outputs: concrete (80/machine * 6 = 480)
    const abstractNodes = [
      {
        id: 'mine_limestone',
        type: 'machine',
        data: { itemId: 'limestone', rate: 720, isInput: true }
      },
      {
        id: 'mine_water',
        type: 'machine',
        data: { itemId: 'water', rate: 600, isInput: true }
      },
      {
        id: 'recipe_wet_concrete',
        type: 'machine',
        data: {
          recipeId: 'wet_concrete',
          buildingId: 'refinery',
          label: 'Влажный бетон',
          machines: 6,
          power: 180,
          itemId: 'concrete',
          inputs: [
            { itemId: 'limestone', rate: 120 },
            { itemId: 'water', rate: 100 }
          ],
          outputs: [
            { itemId: 'concrete', rate: 80 }
          ]
        }
      }
    ];

    const abstractEdges = [
      {
        id: 'e1',
        source: 'mine_limestone',
        target: 'recipe_wet_concrete',
        data: { itemId: 'limestone', rate: 720 }
      },
      {
        id: 'e2',
        source: 'mine_water',
        target: 'recipe_wet_concrete',
        data: { itemId: 'water', rate: 600 }
      }
    ];

    const result = expandToRealisticGraph(abstractNodes, abstractEdges, { useSplitters: true });

    // 1. Should have 6 physical machines
    const physicalMachines = result.nodes.filter(n => n.type === 'physicalMachine');
    expect(physicalMachines.length).toBe(6);

    // 2. Concrete output mergers: for 6 machines, should create 3 mergers!
    const concreteMergers = result.nodes.filter(n => n.type === 'merger' && n.data?.itemId === 'concrete');
    expect(concreteMergers.length).toBe(3);

    // 3. Limestone input splitters: for 6 machines, should create 3 splitters!
    const limestoneSplitters = result.nodes.filter(n => n.type === 'splitter' && n.data?.itemId === 'limestone');
    expect(limestoneSplitters.length).toBe(3);

    // 4. Water input splitters/junctions: for 6 machines, should create 3 junctions!
    const waterSplitters = result.nodes.filter(n => n.type === 'splitter' && n.data?.itemId === 'water');
    expect(waterSplitters.length).toBe(3);

    // 5. Check port limit: no splitter has more than 3 output edges
    limestoneSplitters.forEach(spl => {
      const outEdges = result.edges.filter(e => e.source === spl.id);
      expect(outEdges.length).toBeLessThanOrEqual(3);
    });

    // 6. Check port limit: no merger has more than 3 input edges
    concreteMergers.forEach(mrg => {
      const inEdges = result.edges.filter(e => e.target === mrg.id);
      expect(inEdges.length).toBeLessThanOrEqual(3);
    });

    // 7. Total concrete output reached
    const productNodes = result.nodes.filter(n => n.type === 'productItem' && n.data?.itemId === 'concrete');
    expect(productNodes.length).toBe(1);
    expect(productNodes[0].data.rate).toBeCloseTo(480, 1);
  });

  it('creates zero splitters and mergers when useSplitters is false', () => {
    const abstractNodes = [
      {
        id: 'mine_iron_ore',
        type: 'machine',
        data: { itemId: 'iron_ore', rate: 120, isInput: true }
      },
      {
        id: 'recipe_iron_ingot',
        type: 'machine',
        data: {
          recipeId: 'iron_ingot',
          buildingId: 'smelter',
          label: 'Железный слиток',
          machines: 4,
          power: 16,
          itemId: 'iron_ingot',
          inputs: [{ itemId: 'iron_ore', rate: 30 }],
          outputs: [{ itemId: 'iron_ingot', rate: 30 }]
        }
      }
    ];

    const abstractEdges = [
      {
        id: 'e1',
        source: 'mine_iron_ore',
        target: 'recipe_iron_ingot',
        data: { itemId: 'iron_ore', rate: 120 }
      }
    ];

    const result = expandToRealisticGraph(abstractNodes, abstractEdges, { useSplitters: false });

    const splitters = result.nodes.filter(n => n.type === 'splitter');
    const mergers = result.nodes.filter(n => n.type === 'merger');
    expect(splitters.length).toBe(0);
    expect(mergers.length).toBe(0);

    const physicalMachines = result.nodes.filter(n => n.type === 'physicalMachine');
    expect(physicalMachines.length).toBe(4);
  });
});
