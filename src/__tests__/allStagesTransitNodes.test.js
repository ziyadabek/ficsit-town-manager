import { describe, it } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { calculateAllTransits } from '../engine/campaignTransitEngine.js';

describe('All stages transit inspection', () => {
  it('checks all presets and their input/transit nodes', () => {
    const stagesState = campaignPresets.reduce((acc, stage) => {
      acc[stage.id] = { enabled: true, scale: 1.0 };
      return acc;
    }, {});

    const allTransits = calculateAllTransits(stagesState);

    for (const p of campaignPresets) {
      const stageTransits = allTransits[p.id] || [];
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

      // Also merge p.inputsLimit
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

      const targets = (p.targets || []).map((t, idx) => ({ id: 'target_' + idx, itemId: t.itemId, rate: t.rate }));
      if (p.powerConfig && p.powerConfig.targetMW > 0) {
        targets.push({ id: 'target_power', itemId: 'power', rate: p.powerConfig.targetMW });
      }

      const res = solverTest(targets, effectiveInputs, p.options || {});
      const inputNodes = res.nodes.filter((n) => n.data?.isInput);
      console.log(`[${p.id}] ${p.name} -> inputs: ${inputNodes.length}`);
      inputNodes.forEach((n) => {
        console.log(`   id=${n.id} isImport=${n.data.isImport} isTransit=${n.data.isTransit} isVIP=${n.data.isVIP} label=${n.data.label}`);
      });
    }

    function solverTest(targets, effectiveInputs, options) {
      return solveProductionGraph(targets, effectiveInputs, options);
    }
  });
});
