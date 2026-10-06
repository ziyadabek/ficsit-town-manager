import { describe, it } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { calculateAllTransits } from '../engine/campaignTransitEngine.js';

describe('Stage 4 Transit Check', () => {
  it('inspects Stage 4 inputs and transit usage', () => {
    const p = campaignPresets.find((x) => x.id === 'complex_3');
    console.log('Stage 4 preset:', JSON.stringify(p, null, 2));

    const stagesState = campaignPresets.reduce((acc, stage) => {
      acc[stage.id] = { enabled: true, scale: 1.0 };
      return acc;
    }, {});

    const allTransits = calculateAllTransits(stagesState);
    const stageTransits = allTransits['complex_3'] || [];
    console.log('Stage 4 transits from engine:', stageTransits);

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

    console.log('Effective inputs:', effectiveInputs);

    const result = solveProductionGraph(p.targets, effectiveInputs, p.options || {});
    console.log('Feasible:', result.feasible);
    console.log('Import iron plate in solution:', result.nodes.find(n => n.id === 'import_iron_plate'));
    console.log('Nodes count:', result.nodes.length);
    result.nodes.forEach(n => {
      if (n.data?.isInput || n.data?.isImport) {
        console.log('Input node:', n.id, n.data?.itemId, n.data?.rate);
      }
    });
    const edgesFromImport = result.edges.filter(e => e.source === 'import_iron_plate');
    console.log('Edges from import_iron_plate:', edgesFromImport);

    const edgesFromRecipePlates = result.edges.filter(e => e.source === 'recipe_iron_plate');
    console.log('Edges from recipe_iron_plate:', edgesFromRecipePlates);

    const recipeIronPlate = result.nodes.find(n => n.id === 'recipe_iron_plate');
    console.log('Recipe iron plate machine:', recipeIronPlate);

    const usedRecipes = result.summary.recipes;
    console.log('Used recipes in Stage 4:', usedRecipes.map(r => r.id));
  });
});
