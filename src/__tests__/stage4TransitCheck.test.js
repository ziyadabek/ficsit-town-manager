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

    // Проверка цепочки меди: Медная руда + Железная руда -> Литейная (Слиток медного сплава) -> Конструктор (Проволока)
    const copperFoundryNode = result.nodes.find(n => n.id === 'recipe_alt_copper_alloy_ingot');
    const wireConstructorNode = result.nodes.find(n => n.id === 'recipe_wire');
    expect(copperFoundryNode).toBeDefined();
    expect(copperFoundryNode.data.buildingId).toBe('foundry');
    expect(wireConstructorNode).toBeDefined();
    expect(wireConstructorNode.data.buildingId).toBe('constructor');

    // Убеждаемся, что медная руда НЕ поступает напрямую в конструктор проволоки
    const directOreToWireEdge = result.edges.find(
      e => e.source === 'mine_copper_ore' && e.target === 'recipe_wire'
    );
    expect(directOreToWireEdge).toBeUndefined();

    // Медная руда поступает в литейную медного сплава, а медные слитки — в конструктор проволоки
    const oreToFoundryEdge = result.edges.find(
      e => e.source === 'mine_copper_ore' && e.target === 'recipe_alt_copper_alloy_ingot'
    );
    const ingotToWireEdge = result.edges.find(
      e => e.source === 'recipe_alt_copper_alloy_ingot' && e.target === 'recipe_wire'
    );
    expect(oreToFoundryEdge).toBeDefined();
    expect(oreToFoundryEdge.data.itemId).toBe('copper_ore');
    expect(ingotToWireEdge).toBeDefined();
    expect(ingotToWireEdge.data.itemId).toBe('copper_ingot');
  });
});

