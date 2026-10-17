import { describe, it, expect } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { calculateAllTransits } from '../engine/campaignTransitEngine.js';

describe('Stage 4 Transit Check', () => {
  it('inspects Stage 4 inputs, transit usage, and copper smelting chain for wire', () => {
    const p = campaignPresets.find((x) => x.id === 'complex_3');

    const stagesState = campaignPresets.reduce((acc, stage) => {
      acc[stage.id] = { enabled: true, scale: 1.0 };
      return acc;
    }, {});

    const allTransits = calculateAllTransits(stagesState);
    const stageTransits = allTransits['complex_3'] || [];

    const effectiveInputs = stageTransits.map((t) => ({
      itemId: t.itemId,
      rate: t.rate,
      isImport: true,
      isTransit: true,
      sourceStageId: t.sourceStageId,
      sourceStageName: t.sourceStageName,
      deficit: t.deficit,
      transport: t.transport,
    }));

    (p.inputsLimit || []).forEach(inp => {
      if (!effectiveInputs.some(e => e.itemId === inp.itemId)) {
        effectiveInputs.push({
          id: `inp_${inp.itemId}`,
          itemId: inp.itemId,
          rate: inp.rate,
          isImport: true,
          isTransit: false,
        });
      }
    });

    const result = solveProductionGraph(p.targets, effectiveInputs, p.options || {});
    expect(result.feasible).toBe(true);

    // Проверка цепочки меди: Медная руда -> Плавильня (Медный слиток) -> Конструктор (Проволока)
    const copperSmelterNode = result.nodes.find(n => n.id === 'recipe_copper_ingot');
    const wireConstructorNode = result.nodes.find(n => n.id === 'recipe_wire');
    expect(copperSmelterNode).toBeDefined();
    expect(copperSmelterNode.data.buildingId).toBe('smelter');
    expect(wireConstructorNode).toBeDefined();
    expect(wireConstructorNode.data.buildingId).toBe('constructor');

    // Убеждаемся, что медная руда НЕ поступает напрямую в конструктор проволоки
    const directOreToWireEdge = result.edges.find(
      e => e.source === 'mine_copper_ore' && e.target === 'recipe_wire'
    );
    expect(directOreToWireEdge).toBeUndefined();

    // Медная руда поступает в плавильню медных слитков, а медные слитки — в конструктор проволоки
    const oreToSmelterEdge = result.edges.find(
      e => e.source === 'mine_copper_ore' && e.target === 'recipe_copper_ingot'
    );
    const ingotToWireEdge = result.edges.find(
      e => e.source === 'recipe_copper_ingot' && e.target === 'recipe_wire'
    );
    expect(oreToSmelterEdge).toBeDefined();
    expect(oreToSmelterEdge.data.itemId).toBe('copper_ore');
    expect(ingotToWireEdge).toBeDefined();
    expect(ingotToWireEdge.data.itemId).toBe('copper_ingot');
  });
});

