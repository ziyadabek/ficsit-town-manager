import { describe, it, expect } from 'vitest';
import { solveProductionGraph, BUILDING_TIERS, MAX_TIER_LIMITS, PURITY_MULTIPLIERS } from '../engine/solver';

describe('LP Solver Engine', () => {
  it('solves simple single-step production (Concrete)', () => {
    const targets = [{ id: 't1', itemId: 'concrete', rate: 15 }];
    const inputsLimit = [];
    const options = { optimize: 'raw', altRecipes: [] };

    const result = solveProductionGraph(targets, inputsLimit, options);
    expect(result.feasible).toBe(true);
    expect(result.nodes.length).toBeGreaterThan(0);

    // Standard concrete produces 15/min using 45 limestone/min with 1 constructor
    const recipeNode = result.nodes.find(n => n.data?.recipeId === 'standard_concrete');
    expect(recipeNode).toBeDefined();
    expect(recipeNode.data.machines).toBeCloseTo(1.0, 2);

    const limestoneNode = result.nodes.find(n => n.id === 'mine_limestone');
    expect(limestoneNode).toBeDefined();
    expect(limestoneNode.data.rate).toBeCloseTo(45.0, 2);
  });

  it('solves multi-step chain (Iron Ingot -> Iron Plate)', () => {
    const targets = [{ id: 't1', itemId: 'iron_plate', rate: 20 }];
    const inputsLimit = [];
    const options = { optimize: 'raw', altRecipes: [] };

    const result = solveProductionGraph(targets, inputsLimit, options);
    expect(result.feasible).toBe(true);

    const plateNode = result.nodes.find(n => n.data?.recipeId === 'iron_plate');
    expect(plateNode).toBeDefined();
    expect(plateNode.data.machines).toBeCloseTo(1.0, 2);

    const ingotNode = result.nodes.find(n => n.data?.recipeId === 'iron_ingot');
    expect(ingotNode).toBeDefined();
    expect(ingotNode.data.machines).toBeCloseTo(1.0, 2);

    const oreNode = result.nodes.find(n => n.id === 'mine_iron_ore');
    expect(oreNode).toBeDefined();
    expect(oreNode.data.rate).toBeCloseTo(30.0, 2);
  });

  it('respects forced recipe selection for target item', () => {
    // Wet concrete uses refinery and water + limestone
    const targets = [{ id: 't1', itemId: 'concrete', rate: 80, recipeId: 'wet_concrete' }];
    const inputsLimit = [];
    const options = { optimize: 'raw', altRecipes: ['wet_concrete'] };

    const result = solveProductionGraph(targets, inputsLimit, options);
    expect(result.feasible).toBe(true);

    const wetConcreteNode = result.nodes.find(n => n.data?.recipeId === 'wet_concrete');
    expect(wetConcreteNode).toBeDefined();
    expect(wetConcreteNode.data.machines).toBeCloseTo(1.0, 2);

    // Should require water
    const waterNode = result.nodes.find(n => n.id === 'mine_water');
    expect(waterNode).toBeDefined();
    expect(waterNode.data.rate).toBeCloseTo(100.0, 2);
  });

  it('respects miner purity settings for raw extraction', () => {
    const targets = [{ id: 't1', itemId: 'iron_ingot', rate: 240 }];
    const inputsLimit = [];

    // Normal purity on Mk.3 miner: base 240 * 1.0 = 240 rate per miner -> 1 miner
    const resultNormal = solveProductionGraph(targets, inputsLimit, { minerPurity: 'normal' });
    expect(resultNormal.feasible).toBe(true);
    const minerSummaryNormal = resultNormal.summary.buildings.find(b => b.id === 'miner_mk3');
    expect(minerSummaryNormal).toBeDefined();
    expect(minerSummaryNormal.count).toBeCloseTo(1.0, 2);

    // Impure purity: base 240 * 0.5 = 120 rate per miner -> 2 miners needed
    const resultImpure = solveProductionGraph(targets, inputsLimit, { minerPurity: 'impure' });
    expect(resultImpure.feasible).toBe(true);
    const minerSummaryImpure = resultImpure.summary.buildings.find(b => b.id === 'miner_mk3');
    expect(minerSummaryImpure).toBeDefined();
    expect(minerSummaryImpure.count).toBeCloseTo(2.0, 2);

    // Pure purity: base 240 * 2.0 = 480 rate per miner -> 0.5 miners
    const resultPure = solveProductionGraph(targets, inputsLimit, { minerPurity: 'pure' });
    expect(resultPure.feasible).toBe(true);
    const minerSummaryPure = resultPure.summary.buildings.find(b => b.id === 'miner_mk3');
    expect(minerSummaryPure).toBeDefined();
    expect(minerSummaryPure.count).toBeCloseTo(0.5, 2);
  });

  it('filters recipes and buildings when maxTier is restricted', () => {
    // Heavy modular frame requires manufacturer (Tier 5)
    // When maxTier is tier1 (Tier 1-2 only), it should be impossible
    const targets = [{ id: 't1', itemId: 'heavy_modular_frame', rate: 2 }];
    const inputsLimit = [];
    const options = { maxTier: 'tier1' };

    const result = solveProductionGraph(targets, inputsLimit, options);
    expect(result.feasible).toBe(false);
  });
});
