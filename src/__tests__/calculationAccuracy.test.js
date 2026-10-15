import { describe, it, expect } from 'vitest';
import { solveProductionGraph } from '../engine/solver';
import campaignPresets from '../database/campaignPresets.json';
import { calculateAllTransits } from '../engine/campaignTransitEngine';
import { expandToRealisticGraph } from '../engine/realisticGraphEngine';

describe('Production Calculations Accuracy & Edge Cases', () => {
  describe('Input validation: invalid, negative, infinite and NaN values', () => {
    it('gracefully handles NaN, Infinity, -Infinity, negative and zero targets', () => {
      const invalidTargets = [
        { id: 't1', itemId: 'iron_plate', rate: NaN },
        { id: 't2', itemId: 'iron_plate', rate: Infinity },
        { id: 't3', itemId: 'iron_plate', rate: -Infinity },
        { id: 't4', itemId: 'iron_plate', rate: -50 },
        { id: 't5', itemId: 'iron_plate', rate: 0 },
        { id: 't6', itemId: null, rate: 10 },
        null,
        undefined
      ];

      const result = solveProductionGraph(invalidTargets, []);
      expect(result.feasible).toBe(true);
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.summary.items).toEqual([]);
    });

    it('filters out invalid and negative input limits while accepting valid finite positive ones', () => {
      const targets = [{ id: 't1', itemId: 'iron_plate', rate: 10 }];
      const inputsLimit = [
        { id: 'inp1', itemId: 'iron_ore', rate: NaN },
        { id: 'inp2', itemId: 'iron_ore', rate: -100 },
        { id: 'inp3', itemId: 'iron_ore', rate: Infinity },
        { id: 'inp4', itemId: 'iron_ore', rate: 15 } // 10 iron_plate requires 15 iron_ingot = 15 iron_ore
      ];

      const result = solveProductionGraph(targets, inputsLimit);
      expect(result.feasible).toBe(true);
      const oreNode = result.nodes.find(n => n.id === 'mine_iron_ore');
      expect(oreNode).toBeDefined();
      expect(oreNode.data.rate).toBeCloseTo(15, 2);
    });
  });

  describe('Multiple input limits for the same item', () => {
    it('consolidates multiple input limits into a single node with summed rate and preserves transit info', () => {
      const targets = [{ id: 't1', itemId: 'rotor', rate: 10 }];
      const inputsLimit = [
        { id: 'inp1', itemId: 'iron_rod', rate: 20, isTransit: true, sourceStageName: 'Stage A', deficit: 5 },
        { id: 'inp2', itemId: 'iron_rod', rate: 30, isTransit: true, sourceStageName: 'Stage B', deficit: 0 }
      ];

      const result = solveProductionGraph(targets, inputsLimit);
      expect(result.feasible).toBe(true);

      const rodNodes = result.nodes.filter(n => n.id === 'import_iron_rod');
      expect(rodNodes.length).toBe(1);
      expect(rodNodes[0].data.rate).toBeCloseTo(50, 2);
      expect(rodNodes[0].data.isTransit).toBe(true);
      expect(rodNodes[0].data.deficit).toBe(5);
    });
  });

  describe('Recipes with byproducts and mass balance', () => {
    it('accurately balances byproducts in Alumina Solution (Alumina Solution + Silica byproducts)', () => {
      // Recipe standard_alumina_solution:
      // Inputs: 120 Bauxite + 180 Water
      // Outputs: 120 Alumina Solution + 50 Silica
      const targets = [{ id: 't1', itemId: 'alumina_solution', rate: 120 }];
      const result = solveProductionGraph(targets, []);
      expect(result.feasible).toBe(true);

      const bauxiteItem = result.summary.items.find(i => i.id === 'bauxite');
      const waterItem = result.summary.items.find(i => i.id === 'water');
      const aluminaItem = result.summary.items.find(i => i.id === 'alumina_solution');
      const silicaItem = result.summary.items.find(i => i.id === 'silica');

      expect(bauxiteItem.produced).toBeCloseTo(120, 1);
      expect(waterItem.produced).toBeCloseTo(180, 1);
      expect(aluminaItem.produced).toBeCloseTo(120, 1);
      expect(silicaItem.produced).toBeCloseTo(50, 1);
    });

    it('balances oil processing with polymer resin or heavy oil residue', () => {
      // Plastic: 30 crude oil -> 20 plastic + 10 heavy oil residue
      const targets = [{ id: 't1', itemId: 'plastic', rate: 40 }];
      const result = solveProductionGraph(targets, []);
      expect(result.feasible).toBe(true);

      const oilItem = result.summary.items.find(i => i.id === 'crude_oil');
      const plasticItem = result.summary.items.find(i => i.id === 'plastic');
      const horItem = result.summary.items.find(i => i.id === 'heavy_oil_residue');

      expect(oilItem.produced).toBeCloseTo(60, 1);
      expect(plasticItem.produced).toBeCloseTo(40, 1);
      expect(horItem.produced).toBeCloseTo(20, 1);
    });
  });

  describe('Water recirculation and cyclic flows (VIP Water)', () => {
    it('correctly sets up VIP junction and recirculates water from aluminum scrap into alumina solution', () => {
      // Aluminum scrap standard: 240 Alumina Solution + 120 Coal -> 360 Aluminum Scrap + 120 Water
      // Alumina Solution requires water!
      // Produced water (120/min) is recycled back, reducing fresh makeup water intake
      const targets = [{ id: 't1', itemId: 'aluminum_scrap', rate: 360 }];
      const result = solveProductionGraph(targets, []);
      expect(result.feasible).toBe(true);

      const vipWaterNode = result.nodes.find(n => n.id === 'vip_water');
      expect(vipWaterNode).toBeDefined();
      expect(vipWaterNode.data.isVIP).toBe(true);

      // Byproduct water should be 120
      expect(vipWaterNode.data.byproduct).toBeCloseTo(120, 1);

      // Total water consumed by alumina solution is 360
      // So makeup water from pumps should only be 360 - 120 = 240
      expect(vipWaterNode.data.makeup).toBeCloseTo(240, 1);
      expect(vipWaterNode.data.rate).toBeCloseTo(360, 1);

      const freshWaterPump = result.nodes.find(n => n.id === 'mine_water');
      expect(freshWaterPump).toBeDefined();
      expect(freshWaterPump.data.rate).toBeCloseTo(240, 1);
    });
  });

  describe('Multiple alternative recipes for the same item', () => {
    it('chooses the optimal recipe depending on enabled alternate recipes and optimization criteria', () => {
      // Concrete:
      // standard_concrete: 45 limestone -> 15 concrete (3 limestone / concrete)
      // wet_concrete: 120 limestone + 100 water -> 80 concrete (1.5 limestone / concrete)
      const targets = [{ id: 't1', itemId: 'concrete', rate: 120 }];
      
      // Standard only
      const resStandard = solveProductionGraph(targets, [], {
        optimize: 'raw',
        altRecipes: []
      });
      expect(resStandard.feasible).toBe(true);
      expect(resStandard.nodes.some(n => n.data?.recipeId === 'standard_concrete')).toBe(true);
      const limestoneStd = resStandard.nodes.find(n => n.id === 'mine_limestone');
      expect(limestoneStd.data.rate).toBeCloseTo(360, 1); // 120 * 3 = 360

      // With wet_concrete enabled
      const resWet = solveProductionGraph(targets, [], {
        optimize: 'raw',
        altRecipes: ['wet_concrete']
      });
      expect(resWet.feasible).toBe(true);
      expect(resWet.nodes.some(n => n.data?.recipeId === 'wet_concrete')).toBe(true);
      const limestoneWet = resWet.nodes.find(n => n.id === 'mine_limestone');
      expect(limestoneWet.data.rate).toBeCloseTo(180, 1); // 120 * 1.5 = 180

      // Reinforced Iron Plate:
      // standard: 30 iron plate + 60 screws -> 5 reinforced_iron_plate
      // alt_stitched_iron_plate: 18.75 iron plate + 37.5 wire -> 5.625 reinforced_iron_plate (eliminates screws entirely)
      const targetsPlate = [{ id: 't1', itemId: 'reinforced_iron_plate', rate: 20 }];
      const resStitched = solveProductionGraph(targetsPlate, [], {
        optimize: 'raw',
        altRecipes: ['alt_stitched_iron_plate']
      });
      expect(resStitched.feasible).toBe(true);
      expect(resStitched.nodes.some(n => n.data?.recipeId === 'alt_stitched_iron_plate')).toBe(true);
      // Wire should be produced, screws should NOT be produced
      expect(resStitched.nodes.some(n => n.data?.itemId === 'wire')).toBe(true);
      expect(resStitched.nodes.some(n => n.data?.itemId === 'screws')).toBe(false);
    });
  });

  describe('Campaign Presets & Space Elevator Complexes Flow Verification', () => {
    const complexKeys = Object.keys(campaignPresets);

    it(`verifies all ${complexKeys.length} campaign complexes solve feasibly without duplicate node/edge IDs`, () => {
      const stagesState = {};
      complexKeys.forEach(k => {
        stagesState[k] = { enabled: true, scale: 1.0 };
      });
      const allTransits = calculateAllTransits(stagesState, {});

      complexKeys.forEach(presetId => {
        const preset = campaignPresets[presetId];
        const transits = allTransits[presetId] || [];
        
        let effectiveInputs = [...(preset.inputsLimit || [])];
        transits.forEach(tr => {
          effectiveInputs = effectiveInputs.filter(inp => inp.itemId !== tr.itemId);
          effectiveInputs.push({
            id: `transit_${tr.itemId}`,
            itemId: tr.itemId,
            rate: tr.rate,
            isTransit: true,
            sourceStageName: tr.sourceStageName,
            deficit: tr.deficit
          });
        });

        const result = solveProductionGraph(preset.targets, effectiveInputs, preset.options);
        expect(result.feasible, `Preset ${presetId} (${preset.name}) must be feasible`).toBe(true);

        // Check node ID uniqueness
        const nodeIds = new Set();
        result.nodes.forEach(node => {
          expect(nodeIds.has(node.id), `Duplicate node ID ${node.id} in ${presetId}`).toBe(false);
          nodeIds.add(node.id);
        });

        // Check edge ID uniqueness
        const edgeIds = new Set();
        result.edges.forEach(edge => {
          expect(edgeIds.has(edge.id), `Duplicate edge ID ${edge.id} in ${presetId}`).toBe(false);
          edgeIds.add(edge.id);
        });

        // Check realistic mode expansion
        const realistic = expandToRealisticGraph(result.nodes, result.edges, {
          layoutDirection: preset.layoutDirection || 'LR',
          useSplitters: true
        });

        const realNodeIds = new Set();
        realistic.nodes.forEach(node => {
          expect(realNodeIds.has(node.id), `Duplicate realistic node ID ${node.id} in ${presetId}`).toBe(false);
          realNodeIds.add(node.id);
        });
      });
    });
  });
});
