import { describe, it, expect } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { expandToRealisticGraph } from '../engine/realisticGraphEngine.js';
import dagre from 'dagre';
import items from '../database/items.json';

describe('Power Complexes Graph Verification (Compact & Realistic)', () => {
  const targetPresets = ['power_2a', 'power_4a', 'power_8a'];

  targetPresets.forEach((presetId) => {
    describe(`Preset: ${presetId}`, () => {
      const preset = campaignPresets.find((p) => p.id === presetId);
      expect(preset).toBeDefined();

      const targets = (preset.targets || []).map((t, idx) => ({
        id: `target_${idx}`,
        itemId: t.itemId,
        rate: t.rate,
      }));

      if (preset.powerConfig && preset.powerConfig.targetMW > 0) {
        targets.push({
          id: `target_power_${preset.powerConfig.generatorId}`,
          itemId: 'power',
          rate: preset.powerConfig.targetMW,
        });
      }

      const options = {
        maxBeltSpeed: 780,
        maxPipeFlow: 600,
        miningMultiplier: 1,
        generatorId: preset.powerConfig ? preset.powerConfig.generatorId : null,
        allowedRecipes: preset.allowedRecipes || null,
        somersloopRecipes: {},
        useSplitters: true,
      };

      it('should solve feasible in Compact mode and lay out correctly', () => {
        const result = solveProductionGraph(targets, [], options);
        expect(result.feasible).toBe(true);
        expect(result.nodes.length).toBeGreaterThan(0);
        expect(result.edges.length).toBeGreaterThan(0);

        // Check power machine node exists
        const powerNode = result.nodes.find(
          (n) => n.data?.recipe?.id?.startsWith('recipe_power_') || n.data?.outputs?.some((o) => o.itemId === 'power')
        );
        expect(powerNode).toBeDefined();

        // Dagre test for compact mode
        const g = new dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 220 });

        result.nodes.forEach((n) => {
          g.setNode(n.id, { width: 150, height: 130 });
        });
        result.edges.forEach((e) => {
          g.setEdge(e.source, e.target);
        });

        dagre.layout(g);

        result.nodes.forEach((n) => {
          const pos = g.node(n.id);
          expect(pos).toBeDefined();
          expect(Number.isFinite(pos.x)).toBe(true);
          expect(Number.isFinite(pos.y)).toBe(true);
        });
      });

      it('should expand and lay out correctly in Realistic mode', () => {
        const result = solveProductionGraph(targets, [], options);
        expect(result.feasible).toBe(true);

        const realistic = expandToRealisticGraph(result.nodes, result.edges, {
          layoutDirection: 'LR',
          somersloopRecipes: options.somersloopRecipes,
          maxBelt: 780,
          useSplitters: true,
        });

        expect(realistic.nodes.length).toBeGreaterThan(0);
        expect(realistic.edges.length).toBeGreaterThan(0);

        const nodeIds = new Set(realistic.nodes.map((n) => n.id));
        realistic.edges.forEach((e) => {
          expect(nodeIds.has(e.source)).toBe(true);
          expect(nodeIds.has(e.target)).toBe(true);
        });

        // Check layout
        const g = new dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 220 });

        realistic.nodes.forEach((n) => {
          g.setNode(n.id, { width: 140, height: 130 });
        });
        realistic.edges.forEach((e) => {
          g.setEdge(e.source, e.target);
        });

        dagre.layout(g);

        realistic.nodes.forEach((n) => {
          const pos = g.node(n.id);
          expect(pos).toBeDefined();
          expect(Number.isFinite(pos.x)).toBe(true);
          expect(Number.isFinite(pos.y)).toBe(true);
        });

        // Print stats for report
        const physicalMachines = realistic.nodes.filter((n) => n.type === 'physicalMachine');
        const splitters = realistic.nodes.filter((n) => n.type === 'splitter');
        const mergers = realistic.nodes.filter((n) => n.type === 'merger');
        const inputNodes = realistic.nodes.filter((n) => n.data?.isInput);
        console.log(`[${preset.name}] Realistic: ${physicalMachines.length} physical machines, ${inputNodes.length} inputs, ${splitters.length} splitters, ${mergers.length} mergers, total nodes: ${realistic.nodes.length}, edges: ${realistic.edges.length}`);
      });
    });
  });
});
